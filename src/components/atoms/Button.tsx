import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({ children, ...rest }) => (
  <button
    className="inline-flex items-center justify-center rounded-md px-3 py-2 border text-sm hover:opacity-90 focus:outline-none focus-visible:ring"
    {...rest}
  >
    {children}
  </button>
);

export default Button;
