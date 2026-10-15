import './Footer.css';

export const Footer = ({ children, año }) => {
    return (
        <footer className="app-footer">
            <p className="footer-texto">{children}</p>
            <p className="footer-year">© {año}</p>
        </footer>
    );
};
