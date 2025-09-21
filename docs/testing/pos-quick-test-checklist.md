# POS Commission Mode - Quick Test Checklist

## 🚀 5-Minute Test Plan

### Prerequisites
- [ ] Access to salon POS system
- [ ] Admin permissions (to toggle settings)
- [ ] At least one service and stylist in the system

### Test 1: Verify Current Mode
1. [ ] Go to POS (`/salon/pos` or `/salon/pos2`)
2. [ ] Look at header - do you see commission badge?
   - Green "Commissions ON" badge → Mode is ON
   - Yellow "Commissions OFF — Simple POS" → Mode is OFF
3. [ ] Note the current mode: _____________

### Test 2: Test Current Mode Behavior
#### If Commissions are ON:
1. [ ] Add a service to cart
2. [ ] Try to pay WITHOUT selecting stylist
3. [ ] **Expected**: Error message about missing stylist
4. [ ] Select a stylist
5. [ ] Complete payment
6. [ ] **Expected**: Success

#### If Commissions are OFF:
1. [ ] Add a service to cart
2. [ ] Notice helper text under total: "Commissions are disabled..."
3. [ ] Pay WITHOUT selecting stylist
4. [ ] **Expected**: Payment succeeds
5. [ ] No commission tracking needed

### Test 3: Toggle Commission Mode
1. [ ] Go to Admin → Settings → Salon
2. [ ] Find "Commission Settings" card
3. [ ] Toggle the switch
4. [ ] Enter reason in dialog (optional)
5. [ ] Click "Confirm Change"
6. [ ] **Expected**: Success toast appears

### Test 4: Verify Mode Changed
1. [ ] Return to POS
2. [ ] Check header badge changed
3. [ ] Add service to cart
4. [ ] Test opposite behavior from Test 2
5. [ ] **Expected**: System behaves according to new mode

### Test 5: Check Health Dashboard
1. [ ] Navigate to `/ops/pos-health`
2. [ ] Verify commission mode displayed correctly
3. [ ] Check for any violations or warnings
4. [ ] Note today's sales metrics

## ✅ Success Criteria
- [ ] Commission badge displays correctly
- [ ] ON mode enforces stylist requirement
- [ ] OFF mode allows sales without stylist
- [ ] Toggle works with 30-second cooldown
- [ ] Helper text appears when appropriate
- [ ] No data errors or violations

## 🐛 If Something Goes Wrong
1. Check browser console for errors (F12)
2. Try refreshing the page
3. Verify you have Owner/Admin role
4. Check `/ops/pos-health` for system status
5. Review commission toggle history in settings

## 📝 Notes Section
_Record any issues or observations here:_

_______________________________________________
_______________________________________________
_______________________________________________