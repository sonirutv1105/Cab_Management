import sys

file_path = 'd:/Cab_Management_system/frontend/src/components/DriverManagementView.tsx'
content = open(file_path, 'r', encoding='utf-8').read()

validate_find = '''  const validateStep1 = () => {
    if (!formState.firstName || !formState.lastName || !formState.phone || !formState.email || !formState.address || !formState.licenseNumber || !formState.licenseExpiry || !formState.vendorId) {
      alert("Please fill all mandatory fields (First Name, Last Name, Phone, Email, Address, DL Number, Expiry, Vendor).");
      return false;
    }'''

validate_replace = '''  const validateStep1 = () => {
    if (!formState.firstName || !formState.lastName || !formState.phone || !formState.email || !formState.address || !formState.licenseNumber || !formState.licenseExpiry) {
      alert("Please fill all mandatory fields (First Name, Last Name, Phone, Email, Address, DL Number, Expiry).");
      return false;
    }

    if (vendors.length > 0 && formState.vehicleAssignmentType !== 'Self Car' && !formState.vendorId) {
      alert("Please select a Vendor.");
      return false;
    }'''

select_find = '''                     {/* Row 7 */}
                     <div>
                       <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Vendor *</label>
                       <select value={formState.vendorId} onChange={(e) => setFormState({...formState, vendorId: e.target.value ? Number(e.target.value) : undefined})} className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200" required>
                         <option value="">Select Vendor</option>
                         {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                       </select>
                     </div>'''

select_replace = '''                     {/* Row 7 */}
                     <div>
                       <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Vendor {vendors.length > 0 && formState.vehicleAssignmentType !== 'Self Car' ? '*' : ''}</label>
                       <select value={formState.vendorId || ''} onChange={(e) => setFormState({...formState, vendorId: e.target.value ? Number(e.target.value) : undefined})} className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200" required={vendors.length > 0 && formState.vehicleAssignmentType !== 'Self Car'} disabled={vendors.length === 0 || formState.vehicleAssignmentType === 'Self Car'}>
                         {vendors.length === 0 ? (
                           <option value="">No Vendors Available</option>
                         ) : (
                           <>
                             <option value="">Select Vendor</option>
                             {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                           </>
                         )}
                       </select>
                     </div>'''

content = content.replace(validate_find, validate_replace)
content = content.replace(select_find, select_replace)

open(file_path, 'w', encoding='utf-8').write(content)
print("Patched DriverManagementView.tsx")
