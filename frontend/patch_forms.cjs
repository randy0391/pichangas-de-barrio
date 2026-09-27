const fs = require("fs");

function patchProfilePage(path) {
    let content = fs.readFileSync(path, "utf-8");
    content = content.replace(
        "const [formData, setFormData] = useState({",
        "const [formData, setFormData] = useState({"
    ); // Just to check
    // Actually we need to replace the formData initialization and inputs
    
    // Replace the input:
    let oldInput = `<label className="block text-sm font-medium text-gray-400 mb-1">
                      Nombre
                    </label>
                    <Input
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />`;
                    
    let newInput = `<label className="block text-sm font-medium text-gray-400 mb-1">
                      Nombres
                    </label>
                    <Input
                      name="nombres"
                      required
                      value={formData.nombres || ''}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700 text-white mb-3"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Apellido Paterno</label>
                        <Input name="apellido_paterno" required value={formData.apellido_paterno || ''} onChange={handleChange} className="bg-slate-800/50 border-slate-700 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Apellido Materno</label>
                        <Input name="apellido_materno" required value={formData.apellido_materno || ''} onChange={handleChange} className="bg-slate-800/50 border-slate-700 text-white" />
                      </div>
                    </div>`;
                    
    content = content.replace(oldInput, newInput);
    
    // Replace name display in non-edit mode
    content = content.replace(
        `<p className="text-white font-medium">{user?.name}</p>`,
        `<p className="text-white font-medium">{user?.full_name || user?.name}</p>`
    );
    
    fs.writeFileSync(path, content);
}

function patchMemberFormDialog(path) {
    let content = fs.readFileSync(path, "utf-8");
    
    let oldInput = `<label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Nombre
              </label>
              <Input
                name="name"
                required
                value={formData.name || ''}
                onChange={handleChange}
                className="bg-slate-800 border-slate-700 text-white"
              />`;
              
    let newInput = `<label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Nombres
              </label>
              <Input
                name="nombres"
                required
                value={formData.nombres || ''}
                onChange={handleChange}
                className="bg-slate-800 border-slate-700 text-white mb-4"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Paterno</label>
                  <Input name="apellido_paterno" required value={formData.apellido_paterno || ''} onChange={handleChange} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Materno</label>
                  <Input name="apellido_materno" required value={formData.apellido_materno || ''} onChange={handleChange} className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>`;
              
    content = content.replace(oldInput, newInput);
    fs.writeFileSync(path, content);
}

patchProfilePage("src/features/profile/ProfilePage.tsx");
patchMemberFormDialog("src/features/admin/MemberFormDialog.tsx");
console.log("Patched profile and member forms");
