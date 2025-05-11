import {
  ChevronDownIcon,
  ChevronUpIcon,
  Command,
  BookText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDocumentationPageMutation,
  type DocumentationPage,
} from "@/api/queries";
import { setDocumentationPage, setLoadingContent } from "@/lib/markdown-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ComponentProps } from "react";

interface DocumentationSidebarProps {
  documentation: DocumentationPage[] | undefined;
  isLoading?: boolean;
  error: Error | null;
  className?: string;
}

// This is sample data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Docs",
      url: "#",
      icon: BookText,
      isActive: true,
    },
  ],
};

export function AppSidebar({
  documentation,
  isLoading = false,
  error,
  className = "",
  ...props
}: DocumentationSidebarProps & ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = useState(data.navMain[0]);
  const { setOpen } = useSidebar();

  const { mutate: fetchDocumentationPage, isPending: isFetching } =
    useDocumentationPageMutation();

  useEffect(() => {
    setLoadingContent(isFetching);
  }, [isFetching]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);

  const resultRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Search through documentation titles
  useEffect(() => {
    if (!documentation) return;

    const results: number[] = [];
    documentation.forEach((page, index) => {
      if (page.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, documentation]);

  // Navigate to next search result
  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex((prev) => (prev + 1) % searchResults.length);
  };

  // Navigate to previous search result
  const goToPreviousResult = () => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex(
      (prev) => (prev - 1 + searchResults.length) % searchResults.length
    );
  };

  // Scroll to the current search result
  useEffect(() => {
    if (currentResultIndex >= 0 && currentResultIndex < searchResults.length) {
      const resultIndex = searchResults[currentResultIndex];
      const element = resultRefs.current.get(resultIndex);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentResultIndex, searchResults]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link to="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item);
                        setOpen(true);
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            {/* <Label className="flex items-center gap-2 text-sm">
              <span>Unreads</span>
              <Switch className="shadow-none" />
            </Label> */}
          </div>
          <div className="relative">
            <Input
              data-slot="sidebar-input"
              data-sidebar="input"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background h-8 w-full shadow-none pr-20"
              disabled={isLoading}
            />
            {searchQuery && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchResults.length > 0 ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {currentResultIndex + 1} of {searchResults.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0"
                      onClick={goToPreviousResult}
                    >
                      <ChevronUpIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0"
                      onClick={goToNextResult}
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No results
                  </span>
                )}
              </div>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {documentation?.map((page, index) => (
                <div
                  key={page.id}
                  className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 ${
                    searchResults.includes(index) && searchQuery !== ""
                      ? index === searchResults[currentResultIndex]
                        ? "bg-amber-200/40"
                        : "bg-amber-200/10"
                      : ""
                  }`}
                  onClick={() => {
                    if (page.markdown && page.markdown.length > 0) {
                      setDocumentationPage(page);
                      return;
                    }
                    if (!isFetching) {
                      fetchDocumentationPage(page.id);
                    }
                  }}
                  ref={(el) => {
                    if (el) resultRefs.current.set(index, el);
                  }}
                >
                  {/* <span className="font-medium break-words">{page.title}</span> */}
                  <span className="line-clamp-2 w-[260px] whitespace-break-spaces">
                    {page.title}
                  </span>
                </div>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
