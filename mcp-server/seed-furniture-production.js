#!/usr/bin/env node
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Kerala Furniture Works organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedProductionData() {
  console.log('🏭 Seeding production data for Kerala Furniture Works...');
  console.log(`📍 Organization ID: ${FURNITURE_ORG_ID}`);

  try {
    // 1. Create Work Centers
    const workCenters = [
      {
        entity_type: 'work_center',
        entity_code: 'WC-CUTTING',
        entity_name: 'Cutting Station',
        smart_code: 'HERA.MFG.WORKCENTER.CUTTING.v1',
        metadata: {
          location: 'Shop Floor A',
          capacity_type: 'cutting',
          shift_pattern: '2-shift'
        },
        status: 'active'
      },
      {
        entity_type: 'work_center',
        entity_code: 'WC-ASSEMBLY',
        entity_name: 'Assembly Line 1',
        smart_code: 'HERA.MFG.WORKCENTER.ASSEMBLY.v1',
        metadata: {
          location: 'Shop Floor B',
          capacity_type: 'assembly',
          shift_pattern: '2-shift'
        },
        status: 'active'
      },
      {
        entity_type: 'work_center',
        entity_code: 'WC-FINISHING',
        entity_name: 'Finishing Bay',
        smart_code: 'HERA.MFG.WORKCENTER.FINISHING.v1',
        metadata: {
          location: 'Shop Floor C',
          capacity_type: 'finishing',
          shift_pattern: '1-shift'
        },
        status: 'active'
      }
    ];

    const createdWorkCenters = [];
    for (const wc of workCenters) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          ...wc,
          organization_id: FURNITURE_ORG_ID
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating work center ${wc.entity_name}:`, error.message);
      } else {
        console.log(`✅ Created work center: ${wc.entity_name}`);
        createdWorkCenters.push(data);

        // Add dynamic data for work centers
        const dynamicFields = [
          { field_name: 'capacity_per_shift', field_value_number: wc.entity_code === 'WC-CUTTING' ? 50 : wc.entity_code === 'WC-ASSEMBLY' ? 30 : 40 },
          { field_name: 'efficiency_rate', field_value_number: 0.85 },
          { field_name: 'operating_cost_hour', field_value_number: wc.entity_code === 'WC-CUTTING' ? 500 : wc.entity_code === 'WC-ASSEMBLY' ? 750 : 600 }
        ];

        for (const field of dynamicFields) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: FURNITURE_ORG_ID,
              entity_id: data.id,
              ...field,
              smart_code: wc.smart_code
            });
        }
      }
    }

    // 2. Create Raw Materials
    const rawMaterials = [
      {
        entity_type: 'raw_material',
        entity_code: 'RM-TEAK-PLANK',
        entity_name: 'Teak Wood Planks - Grade A',
        smart_code: 'HERA.MFG.MATERIAL.WOOD.v1',
        metadata: {
          material_type: 'wood',
          grade: 'A',
          unit: 'cubic_feet'
        },
        status: 'active'
      },
      {
        entity_type: 'raw_material',
        entity_code: 'RM-FABRIC-LEATHER',
        entity_name: 'Premium Leather - Brown',
        smart_code: 'HERA.MFG.MATERIAL.FABRIC.v1',
        metadata: {
          material_type: 'fabric',
          color: 'brown',
          unit: 'square_meter'
        },
        status: 'active'
      },
      {
        entity_type: 'raw_material',
        entity_code: 'RM-HARDWARE-SCREWS',
        entity_name: 'Stainless Steel Screws Pack',
        smart_code: 'HERA.MFG.MATERIAL.HARDWARE.v1',
        metadata: {
          material_type: 'hardware',
          size: 'assorted',
          unit: 'pack'
        },
        status: 'active'
      }
    ];

    const createdMaterials = [];
    for (const material of rawMaterials) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          ...material,
          organization_id: FURNITURE_ORG_ID
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating material ${material.entity_name}:`, error.message);
      } else {
        console.log(`✅ Created raw material: ${material.entity_name}`);
        createdMaterials.push(data);

        // Add inventory levels
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: FURNITURE_ORG_ID,
            entity_id: data.id,
            field_name: 'current_stock',
            field_value_number: material.entity_code === 'RM-TEAK-PLANK' ? 250 : material.entity_code === 'RM-FABRIC-LEATHER' ? 150 : 5000,
            smart_code: material.smart_code
          });
      }
    }

    // 3. Get existing products (from previous seed)
    const { data: existingProducts } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'product')
      .limit(3);

    const products = existingProducts || [];

    // 4. Create BOM relationships
    if (products.length > 0 && createdMaterials.length > 0) {
      // Executive Desk BOM
      const deskProduct = products.find(p => p.entity_code === 'DESK-EXE-001');
      if (deskProduct && createdMaterials.length >= 2) {
        await supabase
          .from('core_relationships')
          .insert([
            {
              organization_id: FURNITURE_ORG_ID,
              from_entity_id: deskProduct.id,
              to_entity_id: createdMaterials[0].id, // Teak planks
              relationship_type: 'requires_component',
              smart_code: 'HERA.MFG.BOM.COMPONENT.v1',
              metadata: {
                quantity: 3.5,
                unit: 'cubic_feet',
                scrap_factor: 0.05
              }
            },
            {
              organization_id: FURNITURE_ORG_ID,
              from_entity_id: deskProduct.id,
              to_entity_id: createdMaterials[2].id, // Hardware
              relationship_type: 'requires_component',
              smart_code: 'HERA.MFG.BOM.COMPONENT.v1',
              metadata: {
                quantity: 2,
                unit: 'pack',
                scrap_factor: 0.01
              }
            }
          ]);
        console.log(`✅ Created BOM for Executive Desk`);
      }
    }

    // 5. Create Production Orders
    const productionOrders = [
      {
        transaction_type: 'production_order',
        transaction_code: 'PRD-FRN-2025-0001',
        transaction_date: new Date().toISOString(),
        source_entity_id: products[0]?.id, // Executive Desk
        target_entity_id: createdWorkCenters[1]?.id, // Assembly Line
        total_amount: 10, // Quantity to produce
        smart_code: 'HERA.MFG.PROD.ORDER.v1',
        metadata: {
          planned_start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          planned_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          batch_number: 'BATCH-2025-001',
          customer_order: 'SO-FRN-2025-0001'
        }
      },
      {
        transaction_type: 'production_order',
        transaction_code: 'PRD-FRN-2025-0002',
        transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source_entity_id: products[1]?.id, // Office Chair
        target_entity_id: createdWorkCenters[1]?.id,
        total_amount: 25,
        smart_code: 'HERA.MFG.PROD.ORDER.v1',
        metadata: {
          planned_start: new Date().toISOString(),
          planned_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'normal',
          batch_number: 'BATCH-2025-002',
          customer_order: 'SO-FRN-2025-0002'
        }
      }
    ];

    const createdOrders = [];
    for (const order of productionOrders) {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          ...order,
          organization_id: FURNITURE_ORG_ID
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating production order:`, error.message);
      } else {
        console.log(`✅ Created production order: ${order.transaction_code}`);
        createdOrders.push(data);

        // Create production order status entities if not exist
        const { data: statusEntity } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', FURNITURE_ORG_ID)
          .eq('entity_type', 'workflow_status')
          .eq('entity_code', 'STATUS-IN_PROGRESS')
          .single();

        let inProgressStatusId = statusEntity?.id;

        if (!inProgressStatusId) {
          const { data: newStatus } = await supabase
            .from('core_entities')
            .insert({
              organization_id: FURNITURE_ORG_ID,
              entity_type: 'workflow_status',
              entity_name: 'In Progress',
              entity_code: 'STATUS-IN_PROGRESS',
              smart_code: 'HERA.WORKFLOW.STATUS.IN_PROGRESS.v1'
            })
            .select()
            .single();
          inProgressStatusId = newStatus?.id;
        }

        // Assign status to second order (in progress)
        if (order.transaction_code === 'PRD-FRN-2025-0002' && inProgressStatusId) {
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: FURNITURE_ORG_ID,
              from_entity_id: data.id,
              to_entity_id: inProgressStatusId,
              relationship_type: 'has_status',
              smart_code: 'HERA.MFG.PROD.STATUS.v1',
              metadata: {
                started_at: new Date().toISOString(),
                work_center_id: createdWorkCenters[0]?.id
              }
            });
        }

        // Add production tracking lines
        if (order.transaction_code === 'PRD-FRN-2025-0002') {
          await supabase
            .from('universal_transaction_lines')
            .insert([
              {
                organization_id: FURNITURE_ORG_ID,
                transaction_id: data.id,
                line_number: 1,
                line_type: 'operation',
                entity_id: createdWorkCenters[0]?.id, // Cutting
                quantity: '15',
                line_amount: 180, // Minutes
                smart_code: 'HERA.MFG.EXEC.OPERATION.v1',
                metadata: {
                  operation: 'cutting',
                  completed_quantity: 15,
                  status: 'completed'
                }
              },
              {
                organization_id: FURNITURE_ORG_ID,
                transaction_id: data.id,
                line_number: 2,
                line_type: 'operation',
                entity_id: createdWorkCenters[1]?.id, // Assembly
                quantity: '10',
                line_amount: 300, // Minutes
                smart_code: 'HERA.MFG.EXEC.OPERATION.v1',
                metadata: {
                  operation: 'assembly',
                  completed_quantity: 10,
                  status: 'in_progress'
                }
              }
            ]);
        }
      }
    }

    // 6. Create Machine Log entries
    if (createdWorkCenters.length > 0 && createdOrders.length > 0) {
      const machineLogs = [
        {
          transaction_type: 'machine_log',
          transaction_code: `MLOG-${createdWorkCenters[0].entity_code}-${new Date().toISOString().split('T')[0]}`,
          transaction_date: new Date().toISOString(),
          source_entity_id: createdWorkCenters[0].id,
          target_entity_id: createdOrders[1]?.id,
          smart_code: 'HERA.MFG.MACHINE.LOG.v1',
          metadata: {
            runtime_hours: 6.5,
            downtime_hours: 0.5,
            units_produced: 15,
            efficiency: 85,
            shift: 'morning'
          }
        }
      ];

      for (const log of machineLogs) {
        const { error } = await supabase
          .from('universal_transactions')
          .insert({
            ...log,
            organization_id: FURNITURE_ORG_ID
          });

        if (!error) {
          console.log(`✅ Created machine log: ${log.transaction_code}`);
        }
      }
    }

    console.log('🎉 Production data seeding completed!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

seedProductionData();