const fs = require('fs');
let header = fs.readFileSync('frontend/src/components/app-header.tsx', 'utf8');

// Remove asChild from DropdownMenuTrigger and put button styling directly on it
header = header.replace(
  `    <DropdownMenuTrigger asChild>
      <button
        className="relative text-sidebar-foreground/80 hover:text-sidebar-accent-foreground transition-colors h-9 w-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent outline-none"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </DropdownMenuTrigger>`,
  `    <DropdownMenuTrigger className="relative text-sidebar-foreground/80 hover:text-sidebar-accent-foreground transition-colors h-9 w-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent outline-none">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
    </DropdownMenuTrigger>`
);

if (header.includes('asChild')) {
  console.log('⚠️ asChild still present somewhere');
} else {
  console.log('✅ asChild removed');
}

fs.writeFileSync('frontend/src/components/app-header.tsx', header);
