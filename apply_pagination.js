const fs = require("fs");

function paginateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes("PaginationControls")) {
    content = content.replace("import { Search", "import { PaginationControls } from \"@/components/ui/pagination-controls\"\nimport { Search");
  }

  if (!content.includes("currentPage")) {
    content = content.replace("const [search, setSearch] = useState(\"\")", "const [search, setSearch] = useState(\"\")\n  const [currentPage, setCurrentPage] = useState(1)\n  const ITEMS_PER_PAGE = 10;");
  }

  if (!content.includes("totalPages")) {
    content = content.replace("  return (", "  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)\n  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)\n\n  return (");
  }

  content = content.replace("onChange={(e) => setSearch(e.target.value)}", "onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}");

  content = content.replace(/filtered\.map/g, "paginatedData.map");

  if (!content.includes("<PaginationControls")) {
    content = content.replace("</Table>\n          </div>", "</Table>\n          </div>\n          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />");
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log("Updated " + filePath);
}

paginateFile("frontend/src/app/reports/stock/page.tsx");
paginateFile("frontend/src/app/pos/reports/page.tsx");
paginateFile("frontend/src/app/reports/sales/page.tsx");
paginateFile("frontend/src/app/reports/profit/page.tsx");

