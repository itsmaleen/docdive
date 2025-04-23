import { LinkIcon, SearchIcon, LoaderIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm, useStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";

export function UrlInputEnhanced() {
  const navigate = useNavigate({ from: "/" });
  const form = useForm({
    defaultValues: {
      url: "",
    },
    onSubmit: (data) => {
      navigate({
        to: `/loading?url=${data.value.url}`,
        // params: { url: data.value.url },
      });
    },
    validators: {
      onSubmit({ value }) {
        if (!value.url) return "URL is required";
        if (!z.string().url().safeParse(value.url).success)
          return "Invalid URL";
      },
    },
  });

  const formErrorMap = useStore(form.store, (state) => state.errorMap);

  return (
    <div className="w-full bg-card rounded-lg border border-border p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <form.Field
            name="url"
            children={(field) => (
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Paste API documentation URL..."
                className="pl-10"
              />
            )}
          />
        </div>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "..." : "Load Documentation"}
            </Button>
          )}
        />
      </form>

      {formErrorMap.onSubmit && (
        <p className="text-sm text-red-500 mt-1">{formErrorMap.onSubmit}</p>
      )}
    </div>
  );
}
