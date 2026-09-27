const fs = require("fs");

function patchRegisterPage(path) {
    let content = fs.readFileSync(path, "utf-8");
    content = content.replace("const [name, setName] = useState('');", "const [nombres, setNombres] = useState('');\n  const [apellidoPaterno, setApellidoPaterno] = useState('');\n  const [apellidoMaterno, setApellidoMaterno] = useState('');");
    content = content.replace("fd.append('name', name);", "fd.append('nombres', nombres);\n    fd.append('apellido_paterno', apellidoPaterno);\n    fd.append('apellido_materno', apellidoMaterno);");
    
    let oldInput = `<label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Nombre Completo
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre en la camiseta"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
            />`;
    
    let newInput = `<label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Nombres
            </label>
            <Input
              type="text"
              required
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Tus nombres"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 mb-4"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Apellido Paterno
                </label>
                <Input
                  type="text"
                  required
                  value={apellidoPaterno}
                  onChange={(e) => setApellidoPaterno(e.target.value)}
                  placeholder="Paterno"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Apellido Materno
                </label>
                <Input
                  type="text"
                  required
                  value={apellidoMaterno}
                  onChange={(e) => setApellidoMaterno(e.target.value)}
                  placeholder="Materno"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>`;
    
    content = content.replace(oldInput, newInput);
    fs.writeFileSync(path, content);
}

patchRegisterPage("src/features/auth/RegisterPage.tsx");
patchRegisterPage("src/features/auth/OldPlayerRegisterPage.tsx");
console.log("Patched registration pages");
