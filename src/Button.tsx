import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<Element>> = props => (
    <div role="button" tabIndex={0} {...props} />
);
