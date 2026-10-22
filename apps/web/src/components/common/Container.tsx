import React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  class?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  class: classProp,
  id,
}) => {
  return (
    <section
      id={id}
      className={cn(
        "w-full mx-auto max-w-5xl px-4 sm:px-6 font-para",
        className,
        classProp
      )}
    >
      {children}
    </section>
  );
};

export default Container;
