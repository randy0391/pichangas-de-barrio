const fs = require("fs");

let path = "src/features/profile/ProfilePage.tsx";
let content = fs.readFileSync(path, "utf-8");

// Replace formData initialization
content = content.replace(
    "name: '', email:", 
    "nombres: '', apellido_paterno: '', apellido_materno: '', email:"
);
content = content.replace(
    "name: user.name || '', email:", 
    "nombres: user.nombres || '', apellido_paterno: user.apellido_paterno || '', apellido_materno: user.apellido_materno || '', email:"
);

// Replace the HTML input
const htmlRegex = /<div className="space-y-2">\s*<label.*?Nombre Completo.*?<\/label>\s*<Input[\s\S]*?value=\{formData\.name\}[\s\S]*?onChange=\{\(e\) => setFormData\(\{\s*\.\.\.formData,\s*name:\s*e\.target\.value\s*\}\)\}[\s\S]*?\/>\s*<\/div>/g;

const newInput = `<div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombres</label>
                        <Input 
                            placeholder="Tus nombres" 
                            value={formData.nombres} 
                            onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Apellido Paterno</label>
                        <Input 
                            placeholder="Apellido paterno" 
                            value={formData.apellido_paterno} 
                            onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Apellido Materno</label>
                        <Input 
                            placeholder="Apellido materno" 
                            value={formData.apellido_materno} 
                            onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                        />
                    </div>`;

content = content.replace(htmlRegex, newInput);
fs.writeFileSync(path, content);
console.log("Patched ProfilePage");
