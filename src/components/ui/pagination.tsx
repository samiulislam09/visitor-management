"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  size?: "default" | "sm" | "icon";
}) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size={size}
      className={cn("disabled:pointer-events-none disabled:opacity-50", className)}
      {...(props as React.ComponentProps<"button">)}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span>Prev</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

function PaginationNumber({
  page,
  current,
  onClick,
}: {
  page: number;
  current: number;
  onClick: (page: number) => void;
}) {
  return (
    <PaginationItem>
      <PaginationLink
        isActive={page === current}
        onClick={() => onClick(page)}
        aria-label={`Go to page ${page}`}
        aria-current={page === current ? "page" : undefined}
      >
        {page as unknown as ReactNode}
      </PaginationLink>
    </PaginationItem>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationNumber,
};