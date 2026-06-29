import fs from 'fs';

function forceFix(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace id: 'something' or id: "something" with id: 0
    content = content.replace(/id:\s*['"][^'"]*['"]/g, 'id: 0');
    // Also replace draft_id: 'something'
    content = content.replace(/draft_id:\s*['"][^'"]*['"]/g, 'draft_id: 0');
    // Also replace entityId
    content = content.replace(/entityId:\s*['"][^'"]*['"]/g, 'entityId: 0');
    // Also userId
    content = content.replace(/userId:\s*['"][^'"]*['"]/g, 'userId: 0');
    // Also contractId
    content = content.replace(/contractId:\s*['"][^'"]*['"]/g, 'contractId: 0');
    
    fs.writeFileSync(filePath, content, 'utf-8');
}

forceFix('src/context/CMSContext.tsx');
forceFix('src/context/ContractContext.tsx');
forceFix('src/components/UserManagement.tsx');
forceFix('src/components/ErrorBoundary.tsx');
forceFix('src/components/SuperAdminNotifications.tsx');

console.log("Forced fixes applied.");
