// HERA.SALES.SALES_ORDER.TO_INVOICE.v1 - TypeScript Pattern

interface SalesOrderToInvoiceInput {
  organization_id: string;
  sales_order_id: string;
  partial_quantities?: Record<string, number>;
  invoice_date?: Date;
}

async function convertSalesOrderToInvoice(input: SalesOrderToInvoiceInput) {
  const { organization_id, sales_order_id } = input;
  
  // Step 1: Validate SO status
  const soStatus = await db.query(`
    SELECT e.*, s.entity_code as status_code
    FROM core_entities e
    JOIN core_relationships r ON e.id = r.from_entity_id
    JOIN core_entities s ON r.to_entity_id = s.id
    WHERE e.id = $1 
      AND e.organization_id = $2
      AND r.relationship_type = 'has_status'
      AND s.entity_type = 'workflow_status'
  `, [sales_order_id, organization_id]);
  
  if (soStatus.rows[0]?.status_code !== 'confirmed') {
    throw new Error('SO_NOT_CONFIRMED');
  }
  
  // Step 2: Read SO lines and calculate billable quantities
  const soLines = await db.query(`
    SELECT 
      tl.*,
      e.entity_code as product_code,
      e.entity_name as product_name
    FROM universal_transaction_lines tl
    JOIN core_entities e ON tl.line_entity_id = e.id
    WHERE tl.transaction_id = $1
      AND tl.line_type = 'sales_line'
  `, [sales_order_id]);
  
  // Step 3: Resolve posting profile
  const postingProfile = await resolvePostingProfile(organization_id, soStatus.rows[0]);
  
  // Step 4: Create AR Invoice
  const invoiceResult = await db.transaction(async (trx) => {
    // Insert invoice header
    const invoice = await trx.query(`
      INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        transaction_code,
        transaction_date,
        smart_code,
        total_amount,
        metadata,
        from_entity_id,
        reference_entity_id
      )
      VALUES ($1, 'invoice_ar', $2, $3, 'HERA.FIN.AR.TXN.INVOICE.v1', $4, $5, $6, $7)
      RETURNING *
    `, [
      organization_id,
      generateInvoiceNumber(),
      input.invoice_date || new Date(),
      calculateInvoiceTotal(soLines.rows),
      { sales_order_ref: sales_order_id },
      soStatus.rows[0].from_entity_id, // customer
      sales_order_id
    ]);
    
    // Insert invoice lines
    const invoiceLines = [];
    for (const soLine of soLines.rows) {
      const billableQty = input.partial_quantities?.[soLine.id] || soLine.quantity;
      
      invoiceLines.push(await trx.query(`
        INSERT INTO universal_transaction_lines (
          transaction_id,
          line_number,
          line_type,
          line_entity_id,
          quantity,
          unit_price,
          line_amount,
          smart_code,
          metadata
        )
        VALUES ($1, $2, 'sales_line', $3, $4, $5, $6, 'HERA.FIN.AR.LINE.ITEM.v1', $7)
      `, [
        invoice.rows[0].id,
        soLine.line_number,
        soLine.line_entity_id,
        billableQty,
        soLine.unit_price,
        billableQty * soLine.unit_price,
        { so_line_ref: soLine.id }
      ]));
    }
    
    // Step 5: Create GL Journal Entry
    const journal = await createGLJournal(trx, {
      organization_id,
      invoice: invoice.rows[0],
      postingProfile,
      lines: invoiceLines
    });
    
    return { invoice: invoice.rows[0], journal };
  });
  
  return invoiceResult;
}

async function createGLJournal(trx: any, params: any) {
  const { organization_id, invoice, postingProfile } = params;
  
  // Insert journal header
  const journal = await trx.query(`
    INSERT INTO universal_transactions (
      organization_id,
      transaction_type,
      transaction_code,
      transaction_date,
      smart_code,
      total_amount,
      metadata,
      reference_entity_id
    )
    VALUES ($1, 'journal_entry', $2, $3, 'HERA.FIN.GL.TXN.JOURNAL.v1', $4, $5, $6)
    RETURNING *
  `, [
    organization_id,
    'JE-' + invoice.transaction_code,
    invoice.transaction_date,
    invoice.total_amount,
    { 
      source: 'invoice_ar',
      invoice_ref: invoice.id,
      auto_posted: true 
    },
    invoice.id
  ]);
  
  // Insert journal lines (simplified)
  // Debit: AR Account
  await trx.query(`
    INSERT INTO universal_transaction_lines (
      transaction_id,
      line_number,
      line_type,
      line_entity_id,
      debit_amount,
      credit_amount,
      smart_code
    )
    VALUES ($1, 1, 'gl_debit_line', $2, $3, 0, 'HERA.FIN.GL.LINE.DEBIT.v1')
  `, [
    journal.rows[0].id,
    postingProfile.ar_account_id,
    invoice.total_amount
  ]);
  
  // Credit: Revenue Account
  await trx.query(`
    INSERT INTO universal_transaction_lines (
      transaction_id,
      line_number,
      line_type,
      line_entity_id,
      debit_amount,
      credit_amount,
      smart_code
    )
    VALUES ($1, 2, 'gl_credit_line', $2, 0, $3, 'HERA.FIN.GL.LINE.CREDIT.v1')
  `, [
    journal.rows[0].id,
    postingProfile.revenue_account_id,
    invoice.total_amount
  ]);
  
  return journal.rows[0];
}