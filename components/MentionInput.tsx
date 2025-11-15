import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import Avatar from './ui/Avatar';

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    users: User[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
    value,
    onChange,
    onSubmit,
    users,
    placeholder = 'Escribe un comentario...',
    disabled = false,
    className = ''
}) => {
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    useEffect(() => {
        if (filteredUsers.length > 0) {
            setSelectedIndex(Math.min(selectedIndex, filteredUsers.length - 1));
        }
    }, [filteredUsers.length, selectedIndex]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

        onChange(newValue);

        const textBeforeCursor = newValue.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
                setMentionQuery(textAfterAt);
                setMentionStartPos(lastAtIndex);
                setShowMentions(true);
                setSelectedIndex(0);
                return;
            }
        }

        setShowMentions(false);
        setMentionStartPos(null);
    };

    const insertMention = (user: User) => {
        if (mentionStartPos === null) return;

        const beforeMention = value.substring(0, mentionStartPos);
        const afterMention = value.substring(inputRef.current?.selectionStart || value.length);
        const newValue = `${beforeMention}@${user.full_name} ${afterMention}`;

        onChange(newValue);
        setShowMentions(false);
        setMentionStartPos(null);

        setTimeout(() => {
            if (inputRef.current) {
                const newCursorPos = mentionStartPos + user.full_name.length + 2;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showMentions && filteredUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                insertMention(filteredUsers[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowMentions(false);
            }
        } else if (e.key === 'Enter' && !showMentions) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-bg dark:border-dark-border dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            />

            {showMentions && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                    {filteredUsers.map((user, index) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => insertMention(user)}
                            className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors ${
                                index === selectedIndex ? 'bg-gray-100 dark:bg-dark-bg' : ''
                            }`}
                        >
                            <Avatar user={user} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentionInput;
