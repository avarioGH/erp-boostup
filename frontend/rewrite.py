import re

with open("src/app/crm/customers/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { useRouter } from \"next/navigation\"", "import { useRouter } from \"next/navigation\"\nimport { useDataTable } from \"@/hooks/use-data-table\"\nimport { PaginationControls } from \"@/components/ui/pagination-controls\"")

content = re.sub(r"const \[searchTerm, setSearchTerm\] = useState\(\"\"\)", "const [totalPages, setTotalPages] = useState(1)\n  const { page, limit, search, status, inputValue, setInputValue, handlePageChange, handleStatusChange } = useDataTable({ defaultLimit: 12 })", content)

fetch_original = """const res = await api.get("/customers")
      setCustomers(res.data)"""
fetch_new = """const res = await api.get(/customers?page=&limit=&search=&status=)
      setCustomers(res.data.data || res.data)
      setTotalPages(res.data.totalPages || 1)"""
content = content.replace(fetch_original, fetch_new)

content = content.replace("}, [])", "}, [page, limit, search, status])")

filter_logic = """const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )"""
content = content.replace(filter_logic, "const filteredCustomers = customers")

content = content.replace("value={searchTerm}", "value={inputValue}")
content = content.replace("setSearchTerm(e.target.value)", "setInputValue(e.target.value)")
content = content.replace("searchTerm ?", "inputValue ?")

table_end = "</table>\n            </div>"
pagination_html = "</table>\n            </div>\n            <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />\n            <div className=\"\"></div>"
content = content.replace(table_end, pagination_html)

with open("src/app/crm/customers/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
