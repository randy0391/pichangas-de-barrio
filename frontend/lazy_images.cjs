const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/features/news/NewsPage.tsx',
  'src/features/news/NewsDetailPage.tsx',
  'src/features/members/MembersPage.tsx',
  'src/features/admin/MemberViewDialog.tsx',
  'src/features/admin/AdminMembersPage.tsx',
  'src/features/gallery/GalleryPage.tsx',
  'src/features/admin/AdminGalleryDetailPage.tsx',
  'src/features/gallery/GalleryDetailPage.tsx',
  'src/features/events/EventsPage.tsx',
  'src/features/admin/AdminFinesPage.tsx'
];

filePaths.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace <img ...> with <img loading="lazy" ...> if not present
  // Need to be careful. Let's just find <img and if it doesn't have loading="lazy", add it.
  content = content.replace(/<img\s+(?!.*?loading=["']lazy["'])/g, '<img loading="lazy" ');
  
  fs.writeFileSync(fullPath, content);
});

console.log("Images updated");
