/**
 * Login Page Layout
 * 
 * Simple layout without sidebar for the login page.
 * Full-screen, centered design.
 */

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 ml-0 flex items-center justify-center bg-gradient-subtle">
            {children}
        </div>
    );
}

