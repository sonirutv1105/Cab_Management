import fs from 'fs';

const filePath = 'src/types.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
  [/id: string;/g, 'id: number;'],
  [/draft_id: string;/g, 'draft_id: number;'],
  [/draft_id\?: string;/g, 'draft_id?: number;'],
  [/vendorId: string;/g, 'vendorId: number;'],
  [/assignedVehicleId\?: string;/g, 'assignedVehicleId?: number;'],
  [/assignedDriverId\?: string;/g, 'assignedDriverId?: number;'],
  [/company_id: string;/g, 'company_id: number;'],
  [/driverId: string;/g, 'driverId: number;'],
  [/vehicleId: string;/g, 'vehicleId: number;'],
  [/contractId: string;/g, 'contractId: number;'],
  [/userId: string;/g, 'userId: number;'],
  [/entityId: string;/g, 'entityId: number;'],
  [/role_id: string;/g, 'role_id: number;'],
  [/id\?: string;/g, 'id?: number;'],
  [/driverIds: string\[\];/g, 'driverIds: number[];'],
  [/vehicleIds: string\[\];/g, 'vehicleIds: number[];'],
  [/vendorId\?: string;/g, 'vendorId?: number;'],
];

for (const [pattern, repl] of replacements) {
  content = content.replace(pattern, repl);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Refactored types.ts successfully.');
