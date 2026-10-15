import './TextInput.css';

export const TextInput = ({ children, id, placeholder, name, value, onChange }) => {
    return (
        <div className="text-input-container">
            <label htmlFor={id} className="text-input-label">{children}</label>
            <input
                id={id}
                className="text-input-field"
                type="text"
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </div>
    );
};
