with open("frontend/src/lib/api.ts", "rb") as f:
    content = f.read()

# Try to decode safely, ignore invalid chars and strip the bad 'export default api'
text = content.decode("utf-8", errors="replace")

# Remove the broken export default api
import re
text = re.sub(r'e x p o r t\s+d e f a u l t\s+a p i ;', '', text)
text = text.replace('\x00', '')
text = text.replace('\uFFFD', '')

if "export default api;" not in text:
    text += "\nexport default api;\n"

with open("frontend/src/lib/api.ts", "w", encoding="utf-8") as f:
    f.write(text)

use_auth_content = """import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('erp_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return { token };
}
"""

with open("frontend/src/hooks/useAuth.ts", "w", encoding="utf-8") as f:
    f.write(use_auth_content)
