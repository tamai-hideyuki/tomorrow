import React from 'react';

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
};

const Heading: React.FC<HeadingProps> = ({ level = 2, className = '', children }) => {
  const Tag = `h${level}` as const;
  return <Tag className={className}>{children}</Tag>;
};

export default Heading;
