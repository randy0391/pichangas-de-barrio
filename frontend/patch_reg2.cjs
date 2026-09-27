const fs = require("fs");

function patchPage(path) {
    let content = fs.readFileSync(path, "utf-8");
    
    // Replace state (we already did this, but let's make sure)
    if (!content.includes("const [nombres")) {
        content = content.replace("const [name, setName] = useState('');", "const [nombres, setNombres] = useState('');\n  const [apellidoPaterno, setApellidoPaterno] = useState('');\n  const [apellidoMaterno, setApellidoMaterno] = useState('');");
    }
    
    // Check if we need to remove setName usages (the previous script replaced the input but not completely, or didn't replace it at all)
    
    // Let's use regex to replace the entire input block for name
    const regex = /<div className="space-y-2">\s*<label.*?Nombre Completo.*?<\/label>\s*<Input[\s\S]*?onChange=\{\(e\) => setName\(e\.target\.value\)\}[\s\S]*?\/>\s*<\/div>/g;
    
    const newInput = `<div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombres</label>
                        <Input
                            type="text"
                            required
                            value={nombres}
                            onChange={(e) => setNombres(e.target.value)}
                            placeholder="Tus nombres"
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Apellido Paterno</label>
                            <Input
                                type="text"
                                required
                                value={apellidoPaterno}
                                onChange={(e) => setApellidoPaterno(e.target.value)}
                                placeholder="Paterno"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Apellido Materno</label>
                            <Input
                                type="text"
                                required
                                value={apellidoMaterno}
                                onChange={(e) => setApellidoMaterno(e.target.value)}
                                placeholder="Materno"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-base rounded-xl focus-visible:ring-accent"
                            />
                        </div>
                    </div>`;

    content = content.replace(regex, newInput);
    fs.writeFileSync(path, content);
}

patchPage("src/features/auth/RegisterPage.tsx");
patchPage("src/features/auth/OldPlayerRegisterPage.tsx");
console.log("Patched properly");
