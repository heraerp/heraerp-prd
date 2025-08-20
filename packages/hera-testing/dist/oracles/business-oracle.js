"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessOracle = void 0;
/**
 * Business Logic Oracles - Validate business rules and calculations
 */
class BusinessOracle {
    /**
     * Validate accounting equation (Assets = Liabilities + Equity)
     */
    static validateAccountingEquation(assets, liabilities, equity, tolerance = 0.01) {
        return Math.abs(assets - (liabilities + equity)) < tolerance;
    }
    /**
     * Validate journal entry balance (Debits = Credits)
     */
    static validateJournalBalance(lines) {
        const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        return Math.abs(totalDebits - totalCredits) < 0.01;
    }
    /**
     * Validate transaction profitability
     */
    static calculateProfitability(revenue, cost, expenses = 0) {
        const profit = revenue - cost - expenses;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        const isValid = revenue >= 0 && cost >= 0 && expenses >= 0;
        return { profit, margin, isValid };
    }
    /**
     * Validate inventory levels
     */
    static validateInventoryTransaction(currentStock, transactionQty, transactionType, minStock = 0) {
        const newStock = transactionType === 'in'
            ? currentStock + transactionQty
            : currentStock - transactionQty;
        const isValid = newStock >= 0;
        const warning = newStock < minStock ? `Stock below minimum level (${minStock})` : undefined;
        return { newStock, isValid, warning };
    }
    /**
     * Validate smart code format
     */
    static validateSmartCode(smartCode) {
        const pattern = /^HERA\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.v(\d+)$/;
        const match = smartCode.match(pattern);
        if (!match) {
            return { isValid: false };
        }
        return {
            isValid: true,
            components: {
                system: 'HERA',
                industry: match[1],
                module: match[2],
                function: match[3],
                type: match[4],
                version: match[5],
            },
        };
    }
    /**
     * Validate business workflow status progression
     */
    static validateStatusProgression(currentStatus, newStatus, allowedTransitions) {
        const allowed = allowedTransitions[currentStatus] || [];
        const isValid = allowed.includes(newStatus);
        return {
            isValid,
            reason: isValid ? undefined : `Cannot transition from ${currentStatus} to ${newStatus}`,
        };
    }
    /**
     * Validate credit limit
     */
    static validateCreditLimit(currentBalance, transactionAmount, creditLimit) {
        const newBalance = currentBalance + transactionAmount;
        const isValid = newBalance <= creditLimit;
        const availableCredit = creditLimit - currentBalance;
        const exceedsBy = isValid ? undefined : newBalance - creditLimit;
        return { isValid, availableCredit, exceedsBy };
    }
    /**
     * Validate tax calculation
     */
    static calculateTax(amount, taxRate, inclusive = false) {
        if (inclusive) {
            const netAmount = amount / (1 + taxRate);
            const taxAmount = amount - netAmount;
            return { netAmount, taxAmount, grossAmount: amount };
        }
        else {
            const taxAmount = amount * taxRate;
            const grossAmount = amount + taxAmount;
            return { netAmount: amount, taxAmount, grossAmount };
        }
    }
    /**
     * Validate discount application
     */
    static applyDiscount(originalPrice, discountType, discountValue, maxDiscount) {
        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = originalPrice * (discountValue / 100);
        }
        else {
            discountAmount = discountValue;
        }
        if (maxDiscount && discountAmount > maxDiscount) {
            discountAmount = maxDiscount;
        }
        const finalPrice = originalPrice - discountAmount;
        const isValid = finalPrice >= 0 && discountValue >= 0;
        return {
            discountAmount,
            finalPrice,
            isValid,
            reason: isValid ? undefined : 'Invalid discount parameters',
        };
    }
    /**
     * Validate payment terms
     */
    static calculateDueDate(invoiceDate, paymentTerms) {
        const terms = {
            'COD': 0,
            'NET7': 7,
            'NET15': 15,
            'NET30': 30,
            'NET45': 45,
            'NET60': 60,
            'NET90': 90,
        };
        const daysAllowed = terms[paymentTerms] || 30;
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + daysAllowed);
        return { dueDate, daysAllowed };
    }
    /**
     * Validate batch expiry
     */
    static validateBatchExpiry(expiryDate, warningDays = 30) {
        const today = new Date();
        const daysDiff = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
            isExpired: daysDiff < 0,
            isWarning: daysDiff >= 0 && daysDiff <= warningDays,
            daysUntilExpiry: daysDiff,
        };
    }
    /**
     * Industry-specific validations
     */
    static validateRestaurantOrder(order) {
        const errors = [];
        if (!order.items || order.items.length === 0) {
            errors.push('Order must contain at least one item');
        }
        if (!order.tableNumber && !order.deliveryAddress) {
            errors.push('Order must have either table number or delivery address');
        }
        order.items.forEach((item, index) => {
            if (item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be positive`);
            }
            if (item.price < 0) {
                errors.push(`Item ${index + 1}: Price cannot be negative`);
            }
        });
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    static validateHealthcareAppointment(appointment) {
        const errors = [];
        if (!appointment.patientId) {
            errors.push('Patient ID is required');
        }
        if (!appointment.providerId) {
            errors.push('Provider ID is required');
        }
        if (appointment.duration < 15) {
            errors.push('Appointment duration must be at least 15 minutes');
        }
        if (appointment.duration > 480) {
            errors.push('Appointment duration cannot exceed 8 hours');
        }
        const now = new Date();
        if (appointment.startTime < now) {
            errors.push('Appointment cannot be scheduled in the past');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.BusinessOracle = BusinessOracle;
