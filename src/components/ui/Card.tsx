import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Remove default padding */
    noPadding?: boolean;
    /** Add hover effect */
    hoverable?: boolean;
}

/**
 * Card container component with consistent styling
 * @example
 * <Card>
 *   <CardHeader>Title</CardHeader>
 *   <CardContent>Content here</CardContent>
 * </Card>
 */
export function Card({
    className,
    noPadding = false,
    hoverable = false,
    children,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl border border-slate-200 shadow-sm",
                !noPadding && "p-5",
                hoverable && "hover:shadow-md transition-shadow cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("mb-4", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("text-lg font-bold text-slate-800", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-sm text-slate-500 mt-1", className)} {...props}>
            {children}
        </p>
    );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("", className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("mt-4 pt-4 border-t border-slate-100 flex gap-3", className)} {...props}>
            {children}
        </div>
    );
}
