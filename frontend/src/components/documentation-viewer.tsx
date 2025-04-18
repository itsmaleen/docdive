import { useEffect, useRef } from "react";
import {
  SearchIcon,
  ZapIcon,
  BookOpenIcon,
  ExternalLinkIcon,
  GlobeIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface DocumentationViewerProps {
  url?: string;
  file?: File | null;
  activeSection?: string | null;
  className?: string;
}

export function DocumentationViewer({
  url,
  file,
  activeSection,
  className = "",
}: DocumentationViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSection && viewerRef.current) {
      const sectionElement = viewerRef.current.querySelector(
        `#${activeSection}`
      );
      if (sectionElement) {
        // Scroll to the element with smooth behavior
        sectionElement.scrollIntoView({ behavior: "smooth", block: "center" });

        // Add highlight effect
        sectionElement.classList.add(
          "bg-yellow-100",
          "dark:bg-yellow-900/30",
          "scale-105",
          "transition-all",
          "duration-500"
        );

        // Add a border to make it more noticeable
        sectionElement.classList.add(
          "border-2",
          "border-primary",
          "rounded-lg",
          "shadow-lg"
        );

        // Remove the highlight effect after some time
        setTimeout(() => {
          sectionElement.classList.remove(
            "bg-yellow-100",
            "dark:bg-yellow-900/30",
            "scale-105",
            "border-2",
            "border-primary",
            "shadow-lg"
          );
        }, 3000);
      }
    }
  }, [activeSection]);

  // Mock documentation content
  const mockDocumentation = (
    <div className="space-y-6">
      <div
        id="section-1"
        className="p-4 rounded-lg transition-colors duration-300"
      >
        <h2 className="text-xl font-bold mb-2">GET /api/users</h2>
        <div className="bg-muted p-3 rounded-md mb-3 font-mono text-sm">
          GET https://api.example.com/api/users
        </div>
        <p className="mb-3">Returns a list of users in the system.</p>
        <h3 className="font-semibold mb-2">Parameters</h3>
        <table className="w-full border-collapse mb-3">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-border p-2 text-left">Name</th>
              <th className="border border-border p-2 text-left">Type</th>
              <th className="border border-border p-2 text-left">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">page</td>
              <td className="border border-border p-2">integer</td>
              <td className="border border-border p-2">
                Page number for pagination
              </td>
            </tr>
            <tr>
              <td className="border border-border p-2">limit</td>
              <td className="border border-border p-2">integer</td>
              <td className="border border-border p-2">
                Number of results per page
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        id="section-2"
        className="p-4 rounded-lg transition-colors duration-300"
      >
        <h2 className="text-xl font-bold mb-2">GET /api/users/{"{id}"}</h2>
        <div className="bg-muted p-3 rounded-md mb-3 font-mono text-sm">
          GET https://api.example.com/api/users/{"{id}"}
        </div>
        <p className="mb-3">Returns a specific user by ID.</p>
        <h3 className="font-semibold mb-2">Path Parameters</h3>
        <table className="w-full border-collapse mb-3">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-border p-2 text-left">Name</th>
              <th className="border border-border p-2 text-left">Type</th>
              <th className="border border-border p-2 text-left">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">id</td>
              <td className="border border-border p-2">string</td>
              <td className="border border-border p-2">User ID</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        id="section-3"
        className="p-4 rounded-lg transition-colors duration-300"
      >
        <h2 className="text-xl font-bold mb-2">POST /api/users</h2>
        <div className="bg-muted p-3 rounded-md mb-3 font-mono text-sm">
          POST https://api.example.com/api/users
        </div>
        <p className="mb-3">Creates a new user.</p>
        <h3 className="font-semibold mb-2">Request Body</h3>
        <div className="bg-muted p-3 rounded-md mb-3 font-mono text-sm">
          {`{
 "name": "string",
 "email": "string",
 "role": "string"
}`}
        </div>
      </div>

      <div
        id="section-4"
        className="p-4 rounded-lg transition-colors duration-300"
      >
        <h2 className="text-xl font-bold mb-2">PUT /api/users/{"{id}"}</h2>
        <div className="bg-muted p-3 rounded-md mb-3 font-mono text-sm">
          PUT https://api.example.com/api/users/{"{id}"}
        </div>
        <p className="mb-3">Updates an existing user.</p>
        <h3 className="font-semibold mb-2">Path Parameters</h3>
        <table className="w-full border-collapse mb-3">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-border p-2 text-left">Name</th>
              <th className="border border-border p-2 text-left">Type</th>
              <th className="border border-border p-2 text-left">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">id</td>
              <td className="border border-border p-2">string</td>
              <td className="border border-border p-2">User ID</td>
            </tr>
          </tbody>
        </table>
        <h3 className="font-semibold mb-2">Request Body</h3>
        <div className="bg-muted p-3 rounded-md mb-3 font-mono text-sm">
          {`{
 "name": "string",
 "email": "string",
 "role": "string"
}`}
        </div>
      </div>

      <div
        id="section-5"
        className="p-4 rounded-lg transition-colors duration-300"
      >
        <h2 className="text-xl font-bold mb-2">DELETE /api/users/{"{id}"}</h2>
        <div className="bg-muted p-3 rounded-md mb-3 font-mono text-sm">
          DELETE https://api.example.com/api/users/{"{id}"}
        </div>
        <p className="mb-3">Deletes a user.</p>
        <h3 className="font-semibold mb-2">Path Parameters</h3>
        <table className="w-full border-collapse mb-3">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-border p-2 text-left">Name</th>
              <th className="border border-border p-2 text-left">Type</th>
              <th className="border border-border p-2 text-left">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">id</td>
              <td className="border border-border p-2">string</td>
              <td className="border border-border p-2">User ID</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col bg-card rounded-lg border border-border overflow-hidden ${className}`}
    >
      <div className="border-b border-border p-3 flex items-center justify-between">
        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="site">
              <GlobeIcon className="h-4 w-4 mr-2" />
              Site
            </TabsTrigger>
            <TabsTrigger value="endpoints">
              <ZapIcon className="h-4 w-4 mr-2" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="schemas">
              <BookOpenIcon className="h-4 w-4 mr-2" />
              Schemas
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search documentation..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div ref={viewerRef} className="flex-1 overflow-y-auto p-4">
        {url ? (
          <div className="text-center p-4">
            <div className="flex items-center justify-between mb-4 bg-muted/30 p-2 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Loaded from: {url}
              </p>
              <Button variant="ghost" size="sm" className="h-7">
                <ExternalLinkIcon className="h-4 w-4 mr-1" />
                Open Original
              </Button>
            </div>
            {mockDocumentation}
          </div>
        ) : file ? (
          <div className="text-center p-4">
            <div className="flex items-center justify-between mb-4 bg-muted/30 p-2 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Loaded from file: {file.name}
              </p>
              <Button variant="ghost" size="sm" className="h-7">
                <ExternalLinkIcon className="h-4 w-4 mr-1" />
                View Raw
              </Button>
            </div>
            {mockDocumentation}
          </div>
        ) : (
          <div className="text-center p-4">
            <p>No documentation loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
