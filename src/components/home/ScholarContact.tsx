'use client';

import { useState } from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

// 手动维护谷歌学术累计指标，以后只需修改这里的三个数字。
const scholarStats = {
    citations: 100,
    h_index: 7,
    i10_index: 5,
};

export default function ScholarContact({ href, onOpen }: {
    href: string;
    onOpen: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const visible = open || pinned;
    const values = [
        ['引用次数', scholarStats.citations],
        ['h 指数', scholarStats.h_index],
        ['i10 指数', scholarStats.i10_index],
    ] as const;
    return (
        <div
            className={`relative ${visible ? 'z-30' : ''}`}
            onMouseEnter={() => { setOpen(true); onOpen(); }}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => { setOpen(true); onOpen(); }}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOpen(false);
                    setPinned(false);
                }
            }}
            onKeyDown={event => {
                if (event.key === 'Escape') { setOpen(false); setPinned(false); }
            }}
        >
            <button
                type="button"
                aria-label="谷歌学术"
                aria-expanded={visible}
                aria-controls="scholar-contact-card"
                onClick={() => { setPinned(!pinned); setOpen(!pinned); onOpen(); }}
                className={`p-2 transition-colors duration-200 ${pinned
                    ? 'text-accent'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-accent'}`}
            >
                <AcademicCapIcon className="h-5 w-5" />
            </button>
            {visible && (
                <div id="scholar-contact-card" className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 w-56 max-w-[calc(100vw-2rem)]">
                    <div className="relative bg-neutral-800 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg">
                        <p className="text-center font-semibold mb-3">谷歌学术</p>
                        <dl className="space-y-2">
                            {values.map(([label, value]) => (
                                <div key={label} className="flex justify-between gap-6">
                                    <dt className="text-neutral-300">{label}</dt>
                                    <dd className="tabular-nums">{value.toLocaleString('zh-CN')}</dd>
                                </div>
                            ))}
                        </dl>
                        <a href={href} target="_blank" rel="noopener noreferrer"
                            className="mt-3 flex justify-center bg-accent hover:bg-accent-dark text-white px-3 py-1 rounded-md text-xs transition-colors duration-200">
                            查看谷歌学术主页
                        </a>
                        <p className="mt-2 text-center text-xs text-neutral-400">{pinned ? '再次点击图标取消固定' : '点击图标固定卡片'}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800" />
                    </div>
                </div>
            )}
        </div>
    );
}
