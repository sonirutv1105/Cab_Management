import fs from 'fs';
import path from 'path';

function fixFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const [pattern, repl] of replacements) {
        content = content.replace(pattern, repl);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
}

// 1. ContractDashboard.tsx
fixFile('src/components/contracts/ContractDashboard.tsx', [
    [/(error && !hasRealData)/g, 'error']
]);

// 2. ErrorBoundary.tsx
fixFile('src/components/ErrorBoundary.tsx', [
    [/return \(this.props as any\)\.children;/g, 'return this.props.children;']
]);

// 3. SuperAdminNotifications.tsx
fixFile('src/components/SuperAdminNotifications.tsx', [
    [/import \{ NotificationItem \} from "\.\/SuperAdminLayout";/g, 'import NotificationItem from "./SuperAdminLayout";']
]);

// 4. SuperAdminRoles.tsx, Tasks, Tenders, Announcements, Users - mostly string assignments to ID
const generalReplacements = [
    [/id: ""/g, 'id: 0'],
    [/id: string/g, 'id: number'],
    [/=== ""/g, '=== 0'],
    [/!== ""/g, '!== 0'],
    [/\? "" :/g, '? 0 :'],
];

const filesToFixGeneric = [
    'src/components/SuperAdminAnnouncements.tsx',
    'src/components/SuperAdminRoles.tsx',
    'src/components/SuperAdminTasks.tsx',
    'src/components/SuperAdminTenders.tsx',
    'src/components/SuperAdminUsers.tsx'
];

for (const f of filesToFixGeneric) {
    if (fs.existsSync(f)) {
        fixFile(f, generalReplacements);
    }
}

console.log('Fixed components.');
