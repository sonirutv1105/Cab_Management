import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace method signatures id: string -> id: number
  content = content.replace(/\(id: string/g, '(id: number');
  content = content.replace(/contractId: string/g, 'contractId: number');
  content = content.replace(/driverId: string/g, 'driverId: number');
  content = content.replace(/vehicleId: string/g, 'vehicleId: number');
  content = content.replace(/vendorId: string/g, 'vendorId: number');
  
  // Fake ID generators Date.now().toString() -> Date.now()
  content = content.replace(/Date\.now\(\)\.toString\(\)/g, 'Date.now()');
  
  // ID comparisons like `id === '1'` to `id === 1` inside array functions usually done via generic fixes, but this is hard to regex reliably. We will just fix the Date.now() to number.
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

replaceInFile('src/api/client.ts');
replaceInFile('src/context/CMSContext.tsx');
replaceInFile('src/context/ContractContext.tsx');
replaceInFile('src/components/UserManagement.tsx');

console.log('Refactored contexts successfully.');
