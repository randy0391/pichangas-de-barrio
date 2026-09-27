const fs = require('fs');
const path = require('path');

// 1. AppRouter.tsx
const appRouterPath = path.join(__dirname, 'src', 'routes', 'AppRouter.tsx');
let appRouterContent = fs.readFileSync(appRouterPath, 'utf8');

const importsToReplace = [
  ['HomePage', '@/features/home/HomePage'],
  ['LoginPage', '@/features/auth/LoginPage'],
  ['RegisterPage', '@/features/auth/RegisterPage'],
  ['OldPlayerRegisterPage', '@/features/auth/OldPlayerRegisterPage'],
  ['NewsPage', '@/features/news/NewsPage'],
  ['NewsDetailPage', '@/features/news/NewsDetailPage'],
  ['EventsPage', '@/features/events/EventsPage'],
  ['GalleryPage', '@/features/gallery/GalleryPage'],
  ['GalleryDetailPage', '@/features/gallery/GalleryDetailPage'],
  ['UserDashboardPage', '@/features/dashboard/UserDashboardPage'],
  ['ConvocatoriasPage', '@/features/convocatorias/ConvocatoriasPage'],
  ['ConvocatoriaDetailPage', '@/features/convocatorias/ConvocatoriaDetailPage'],
  ['MisParticipacionesPage', '@/features/convocatorias/MisParticipacionesPage'],
  ['ProfilePage', '@/features/profile/ProfilePage'],
  ['MyFinesPage', '@/features/profile/MyFinesPage'],
  ['MembersPage', '@/features/members/MembersPage'],
  ['AdminDashboardPage', '@/features/admin/AdminDashboardPage'],
  ['AdminPostsPage', '@/features/admin/AdminPostsPage'],
  ['AdminEventsPage', '@/features/admin/AdminEventsPage'],
  ['AdminConvocatoriasPage', '@/features/admin/AdminConvocatoriasPage'],
  ['AdminGalleriesPage', '@/features/admin/AdminGalleriesPage'],
  ['AdminGalleryDetailPage', '@/features/admin/AdminGalleryDetailPage'],
  ['AdminMembersPage', '@/features/admin/AdminMembersPage'],
  ['AdminFinesPage', '@/features/admin/AdminFinesPage'],
  ['AdminAttendanceReportPage', '@/features/admin/AdminAttendanceReportPage'],
];

importsToReplace.forEach(([component, importPath]) => {
  const staticImport = new RegExp(`import \\{ ${component} \\} from '${importPath}';`, 'g');
  appRouterContent = appRouterContent.replace(staticImport, `const ${component} = React.lazy(() => import('${importPath}').then(m => ({ default: m.${component} })));`);
});

if (!appRouterContent.includes('import React from \'react\';')) {
  appRouterContent = `import React from 'react';\n` + appRouterContent;
}

if (!appRouterContent.includes('import { FootballSpinner }')) {
  appRouterContent = appRouterContent.replace(
    `import { ProtectedRoute } from '@/components/ProtectedRoute';`,
    `import { ProtectedRoute } from '@/components/ProtectedRoute';\nimport { FootballSpinner } from '@/components/ui/FootballSpinner';`
  );
}

// Wrap Routes in Suspense
if (!appRouterContent.includes('<React.Suspense')) {
  appRouterContent = appRouterContent.replace('<Routes>', '<React.Suspense fallback={<FootballSpinner />}><Routes>');
  appRouterContent = appRouterContent.replace('</Routes>', '</Routes></React.Suspense>');
}

fs.writeFileSync(appRouterPath, appRouterContent);

// 2. axios.ts
const axiosPath = path.join(__dirname, 'src', 'lib', 'axios.ts');
let axiosContent = fs.readFileSync(axiosPath, 'utf8');

if (!axiosContent.includes('timeout: 30000')) {
  axiosContent = axiosContent.replace(
    `baseURL: \`\${BACKEND_URL}/api\`,`,
    `baseURL: \`\${BACKEND_URL}/api\`,\n  timeout: 30000,`
  );
}

if (!axiosContent.includes('api.interceptors.response.use')) {
  const interceptor = `
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
`;
  axiosContent = axiosContent.replace('export default api;', interceptor + '\nexport default api;');
}
fs.writeFileSync(axiosPath, axiosContent);

// 3. vercel.json
const vercelPath = path.join(__dirname, 'vercel.json');
const vercelConfig = {
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
};
fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));

console.log("Patch applied for tasks 1, 2, 3");
