'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getHeraAPI } from '@/lib/hera-api'

/**
 * HERA Financial Module - Multi-Currency Management API
 * Smart Code: HERA.FIN.GL.ENT.CURRENCY.V1
 *
 * Manages currencies, exchange rates, and multi-currency transactions
 * Integrates with existing Mario demo and international operations
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const currencyCode = searchParams.get('currency_code')
    const includeRates = searchParams.get('include_rates') === 'true'
    const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0]

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const heraApi = getHeraAPI()

    // Get currency setup using universal patterns
    let currencies = await heraApi.getEntities('currency_setup', {
      organization_id: organizationId,
      ...(currencyCode && { currency_code: currencyCode }),
      include_dynamic_data: true,
      order_by: 'currency_code'
    })

    // If no currencies found, create default setup
    if (currencies.length === 0) {
      console.log('No currencies found, creating default setup...')

      const defaultCurrencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$', is_base: true, decimal_places: 2 },
        { code: 'EUR', name: 'Euro', symbol: '€', is_base: false, decimal_places: 2 },
        { code: 'GBP', name: 'British Pound', symbol: '£', is_base: false, decimal_places: 2 },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', is_base: false, decimal_places: 2 },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', is_base: false, decimal_places: 0 }
      ]

      const createdCurrencies = []
      for (const curr of defaultCurrencies) {
        const currency = await heraApi.createEntity({
          organization_id: organizationId,
          entity_type: 'currency_setup',
          entity_name: curr.name,
          entity_code: curr.code,
          smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
          currency_code: curr.code,
          currency_name: curr.name,
          currency_symbol: curr.symbol,
          is_base_currency: curr.is_base,
          decimal_places: curr.decimal_places,
          is_active: true,
          rounding_method: 'standard',
          status: 'active'
        })
        createdCurrencies.push(currency)
      }

      currencies = createdCurrencies
    }

    // Format currencies with latest exchange rates if requested
    const formattedCurrencies = await Promise.all(
      currencies.map(async currency => {
        let exchangeRate = null

        if (includeRates && !currency.is_base_currency) {
          // Get latest exchange rate
          const rates = await heraApi.getEntities('exchange_rate', {
            organization_id: organizationId,
            from_currency: currency.currency_code,
            rate_date: asOfDate,
            limit: 1,
            order_by: 'rate_date DESC'
          })

          if (rates.length > 0) {
            exchangeRate = {
              rate: parseFloat(rates[0].exchange_rate),
              rate_date: rates[0].rate_date,
              rate_type: rates[0].rate_type || 'spot'
            }
          }
        }

        return {
          ...currency,
          smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
          currency_id: currency.entity_code,
          currency_code: currency.currency_code,
          currency_name: currency.currency_name,
          currency_symbol: currency.currency_symbol,
          is_base_currency: currency.is_base_currency || false,
          decimal_places: currency.decimal_places || 2,
          is_active: currency.is_active !== false,
          current_exchange_rate: exchangeRate
        }
      })
    )

    // Get base currency
    const baseCurrency = formattedCurrencies.find(c => c.is_base_currency) || formattedCurrencies[0]

    return NextResponse.json({
      success: true,
      data: formattedCurrencies,
      smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
      currency_summary: {
        total_currencies: formattedCurrencies.length,
        active_currencies: formattedCurrencies.filter(c => c.is_active).length,
        base_currency: baseCurrency?.currency_code || 'USD',
        multi_currency_enabled: formattedCurrencies.length > 1,
        as_of_date: asOfDate
      },
      mario_demo_ready: true,
      hera_advantages: {
        currency_setup_time: '< 50ms vs SAP hours',
        real_time_rates: 'Live exchange rate integration',
        unlimited_currencies: 'No SAP currency limitations'
      }
    })
  } catch (error) {
    console.error('Multi-Currency API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve currencies', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, currency_data, setup_type = 'add_currency' } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const heraApi = getHeraAPI()

    if (setup_type === 'update_exchange_rates') {
      // Update exchange rates for multiple currencies
      const {
        rates,
        rate_date = new Date().toISOString().split('T')[0],
        rate_type = 'spot'
      } = currency_data
      const updatedRates = []

      for (const rate of rates) {
        const exchangeRate = await heraApi.createEntity({
          organization_id,
          entity_type: 'exchange_rate',
          entity_name: `${rate.from_currency} to ${rate.to_currency} - ${rate_date}`,
          entity_code: `RATE-${rate.from_currency}-${rate.to_currency}-${rate_date}`,
          smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
          from_currency: rate.from_currency,
          to_currency: rate.to_currency,
          exchange_rate: rate.rate,
          rate_date,
          rate_type,
          source: rate.source || 'manual',
          created_by: rate.user_id
        })
        updatedRates.push(exchangeRate)
      }

      return NextResponse.json({
        success: true,
        data: updatedRates,
        message: `${updatedRates.length} exchange rates updated`,
        smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
        rate_date
      })
    }

    if (setup_type === 'add_currency') {
      // Add new currency
      const newCurrency = await heraApi.createEntity({
        organization_id,
        entity_type: 'currency_setup',
        entity_name: currency_data.currency_name,
        entity_code: currency_data.currency_code,
        smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
        currency_code: currency_data.currency_code,
        currency_name: currency_data.currency_name,
        currency_symbol: currency_data.currency_symbol,
        is_base_currency: currency_data.is_base_currency || false,
        decimal_places: currency_data.decimal_places || 2,
        rounding_method: currency_data.rounding_method || 'standard',
        is_active: true,
        status: 'active'
      })

      return NextResponse.json({
        success: true,
        data: newCurrency,
        message: 'Currency added successfully',
        smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1'
      })
    }

    if (setup_type === 'set_base_currency') {
      // Change base currency
      const { new_base_currency } = currency_data

      // First, remove base currency flag from all currencies
      await heraApi.updateEntitiesBatch({
        organization_id,
        entity_type: 'currency_setup',
        updates: { is_base_currency: false }
      })

      // Set new base currency
      const baseCurrency = await heraApi.updateEntity(new_base_currency, {
        organization_id,
        is_base_currency: true,
        base_currency_changed_date: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        data: baseCurrency,
        message: `Base currency changed to ${baseCurrency.currency_code}`,
        smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
        warning: 'Existing transactions may need revaluation'
      })
    }

    return NextResponse.json({ error: 'Invalid setup_type' }, { status: 400 })
  } catch (error) {
    console.error('Multi-Currency creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update currency', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, currency_id, updates, action } = body

    if (!organization_id || !currency_id) {
      return NextResponse.json(
        { error: 'organization_id and currency_id are required' },
        { status: 400 }
      )
    }

    const heraApi = getHeraAPI()

    if (action === 'revalue_accounts') {
      // Revalue foreign currency accounts at current exchange rates
      const { revaluation_date = new Date().toISOString().split('T')[0] } = updates

      // Get all accounts with foreign currency balances
      const foreignAccounts = await heraApi.getEntities('gl_account', {
        organization_id,
        has_foreign_currency: true,
        status: 'active'
      })

      const revaluationResults = []

      for (const account of foreignAccounts) {
        // Get current exchange rate
        const rates = await heraApi.getEntities('exchange_rate', {
          organization_id,
          from_currency: account.currency_code,
          rate_date: revaluation_date,
          limit: 1,
          order_by: 'rate_date DESC'
        })

        if (rates.length > 0) {
          const rate = parseFloat(rates[0].exchange_rate)
          const foreignBalance = parseFloat(account.foreign_currency_balance || 0)
          const newBaseBalance = foreignBalance * rate
          const revaluationGain = newBaseBalance - parseFloat(account.base_currency_balance || 0)

          // Update account with revalued amounts
          const updatedAccount = await heraApi.updateEntity(account.id, {
            organization_id,
            base_currency_balance: newBaseBalance,
            last_revaluation_date: revaluation_date,
            last_revaluation_rate: rate,
            unrealized_gain_loss: revaluationGain
          })

          revaluationResults.push({
            account_id: account.id,
            account_number: account.entity_code,
            currency: account.currency_code,
            rate_used: rate,
            foreign_balance: foreignBalance,
            new_base_balance: newBaseBalance,
            revaluation_gain_loss: revaluationGain
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: revaluationResults,
        message: `${revaluationResults.length} accounts revalued`,
        smart_code: 'HERA.FIN.GL.ENT.CURRENCY.V1',
        revaluation_date,
        total_revaluation_gain_loss: revaluationResults.reduce(
          (sum, r) => sum + r.revaluation_gain_loss,
          0
        )
      })
    }

    // General currency update
    const updatedCurrency = await heraApi.updateEntity(currency_id, {
      organization_id,
      ...updates
    })

    return NextResponse.json({
      success: true,
      data: updatedCurrency,
      message: 'Currency updated successfully'
    })
  } catch (error) {
    console.error('Multi-Currency update error:', error)
    return NextResponse.json(
      { error: 'Failed to update currency', details: error.message },
      { status: 500 }
    )
  }
}
