import { useState } from "react";
import { UploadIcon, LinkIcon, SearchIcon, LoaderIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { z } from "zod";

interface UrlInputEnhancedProps {
  onUrlSubmit: (url: string) => void;
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export function UrlInputEnhanced({
  onUrlSubmit,
  onFileUpload,
  isLoading = false,
}: UrlInputEnhancedProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [inputType, setInputType] = useState<"url" | "file">("url");
  const [fileName, setFileName] = useState<string>("");
  const [submittedUrl, setSubmittedUrl] = useState<string>("");
  const [submittedFile, setSubmittedFile] = useState<string>("");
  const [urlError, setUrlError] = useState<string>("");

  const validateUrl = (url: string) => {
    try {
      z.string().url().parse(url);
      setUrlError("");
      return true;
    } catch (error) {
      setUrlError("Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (validateUrl(inputValue.trim())) {
      onUrlSubmit(inputValue.trim());
      setSubmittedUrl(inputValue.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      onFileUpload(file);
      setSubmittedFile(file.name);
    }
  };

  const toggleInputType = () => {
    setInputType(inputType === "url" ? "file" : "url");
    setInputValue("");
    setFileName("");
  };

  return (
    <div className="w-full bg-card rounded-lg border border-border p-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          {inputType === "url" ? (
            <>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Paste API documentation URL..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value) validateUrl(e.target.value);
                }}
                className={`pl-10 ${urlError ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="flex-1 h-10"
                disabled={isLoading}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                {fileName || "Choose file"}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.json,.yaml,.yml"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={toggleInputType}
            className="px-3"
            disabled={isLoading}
          >
            {inputType === "url" ? (
              <UploadIcon className="h-4 w-4" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
          </Button>

          {inputType === "url" ? (
            <Link
              to="/loading"
              search={{ url: inputValue.trim() }}
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${
                !inputValue.trim() || isLoading || urlError
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              Load Documentation
            </Link>
          ) : (
            submittedFile && (
              <a
                // to="/loading"
                // state={{ file: submittedFile }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                Process File
              </a>
            )
          )}
        </div>
      </form>

      {urlError && <p className="text-sm text-red-500 mt-1">{urlError}</p>}
    </div>
  );
}
