import re

with open("frontend/src/app/hr/employees/page.tsx", "r") as f:
    content = f.read()

# Add icons
content = content.replace('Plus, Fingerprint, CheckCircle2, ScanFace, Loader2', 'Plus, Fingerprint, CheckCircle2, ScanFace, Loader2, Edit, Trash')

# Add delete function
del_func = """
 const deleteEmp = async (id: string) => {
   if(confirm("Yakin hapus karyawan ini?")) {
     await HrAPI.deleteEmployee(id);
     fetchData();
   }
 }
 
 const editEmp = (emp: any) => {
   setFormData({
     firstName: emp.first_name,
     lastName: emp.last_name,
     email: emp.email || "",
     position: emp.position || "",
     basicSalary: emp.basic_salary || ""
   });
   setShowForm(true);
 }
"""
content = content.replace('const fetchData', del_func + '\n const fetchData')

# Modify card
card_orig = """<CardTitle className="text-lg flex justify-between items-center">
   <span>{emp.first_name} {emp.last_name}</span>"""

card_new = """<CardTitle className="text-lg flex justify-between items-center">
   <div className="flex flex-col gap-1">
     <span>{emp.first_name} {emp.last_name}</span>
     <div className="flex gap-2">
       <Button variant="outline" size="sm" onClick={() => editEmp(emp)} className="h-6 px-2 text-xs text-blue-500 border-blue-200 hover:bg-blue-50"><Edit className="h-3 w-3 mr-1" /> Edit</Button>
       <Button variant="outline" size="sm" onClick={() => deleteEmp(emp.id)} className="h-6 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50"><Trash className="h-3 w-3 mr-1" /> Hapus</Button>
     </div>
   </div>"""
content = content.replace(card_orig, card_new)

with open("frontend/src/app/hr/employees/page.tsx", "w") as f:
    f.write(content)
print("Updated page.tsx")
