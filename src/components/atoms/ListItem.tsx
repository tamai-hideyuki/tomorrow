import React from 'react';
import clsx from 'clsx';

type ListItemProps = {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

const ListItem: React.FC<ListItemProps> = ({ active, onClick, children }) => (
  <div
    role="option"
    aria-selected={active}
    tabIndex={0}
    onClick={onClick}
    className={clsx(
      'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer focus:outline-none focus-visible:ring',
      active ? 'bg-gray-200' : 'hover:bg-gray-100'
    )}
  >
    {children}
  </div>
);

export default ListItem;
