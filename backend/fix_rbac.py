import os
import re

controllers = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.controller.ts'):
            controllers.append(os.path.join(root, file))

for file in controllers:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '@PermissionsGuard' not in content and '@Permissions(' not in content:
        module = os.path.basename(os.path.dirname(file))
        if module == 'controllers': module = os.path.basename(os.path.dirname(os.path.dirname(file)))
        if module in ['mo', 'scheduling', 'quality']: module = 'manufacturing'
        elif module == 'crm' or module == 'bank-reconciliation': continue
        
        depth = file.count('/') + file.count('\\') - 1
        up = '../' * depth
        if 'PermissionsGuard' not in content:
            content = f"import {{ PermissionsGuard }} from '{up}auth/permissions.guard';\nimport {{ Permissions }} from '{up}auth/permissions.decorator';\n" + content
        
        content = re.sub(r'@UseGuards\(\s*JwtAuthGuard\s*\)', '@UseGuards(JwtAuthGuard, PermissionsGuard)', content)
        
        def replacer(match):
            method = match.group(1)
            rest = match.group(2)
            action = 'view'
            if method == 'Post': action = 'create'
            elif method in ['Put', 'Patch']: action = 'update'
            elif method == 'Delete': action = 'delete'
            
            # extract resource from route string if any, like 'categories' or 'products'
            res = re.search(r"'(.*?)'", rest)
            resource = module
            if res:
                route = res.group(1)
                # simple heuristics
                if 'categor' in route: resource = f"{module}.category"
                elif 'product' in route: resource = f"{module}.product"
                elif 'warehouse' in route: resource = f"{module}.warehouse"
                elif 'order' in route: resource = f"{module}.order"
                elif 'invoice' in route: resource = f"{module}.invoice"
                elif 'payment' in route: resource = f"{module}.payment"
            
            return f"@Permissions('{resource}.{action}')\n  @{method}({rest})"
            
        content = re.sub(r'@(Get|Post|Put|Patch|Delete)\((.*?)\)', replacer, content)
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file}")
