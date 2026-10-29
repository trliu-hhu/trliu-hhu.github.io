'use client';

import { useState, useEffect, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  EnvelopeIcon,
  AcademicCapIcon,
  HeartIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import {
  MapPinIcon as MapPinSolidIcon,
  EnvelopeIcon as EnvelopeSolidIcon,
  AcademicCapIcon as AcademicCapSolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';
import { Github, Linkedin, Pin } from 'lucide-react';
import type { SiteConfig } from '@/lib/config';
import { useMessages } from '@/lib/i18n/useMessages';

// Custom ORCID icon component
const OrcidIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.425.947.947 0 .522-.422.947-.947.947a.95.95 0 01-.947-.947c0-.522.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.434h2.297c2.309 0 3.816-1.519 3.816-3.719 0-2.072-1.331-3.715-3.722-3.715h-2.391z" />
  </svg>
);

interface ProfileProps {
  author: SiteConfig['author'];
  social: SiteConfig['social'];
  features: SiteConfig['features'];
  researchInterests?: string[];
}

export default function Profile({ author, social, features, researchInterests }: ProfileProps) {
  const messages = useMessages();

  const [hasLiked, setHasLiked] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [isAddressPinned, setIsAddressPinned] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [isEmailPinned, setIsEmailPinned] = useState(false);
  const [showScholar, setShowScholar] = useState(false);
  const [isScholarPinned, setIsScholarPinned] = useState(false);
  const [lastClickedTooltip, setLastClickedTooltip] = useState<'email' | 'address' | 'scholar' | null>(null);

  // 整理需要展示的照片列表 (优先使用 avatars 数组，若无则退回到单张 avatar)
  const avatarList = author.avatars && author.avatars.length > 0
    ? author.avatars
    : [author.avatar];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 自动滚动定时器：每 3.5 秒切换下一张，鼠标悬停在照片框上时暂停
  useEffect(() => {
    if (avatarList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % avatarList.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [avatarList.length, isPaused]);

  // 谷歌学术指标状态（以当前真实数据兜底，页面加载后自动抓取最新值）
  const [scholarStats, setScholarStats] = useState({
    citations: '98',
    hIndex: '7',
    i10Index: '5',
  });

  useEffect(() => {
    if (!social.google_scholar) return;

    const cached = localStorage.getItem('scholar-stats-cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.citations && parsed.hIndex && parsed.i10Index) {
          setScholarStats(parsed);
        }
      } catch {}
    }

    const fetchScholarStats = async () => {
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(social.google_scholar!)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) return;
        const data = await res.json();
        const html: string = data?.contents || '';
        const matches = [...html.matchAll(/class="gsc_rsb_std">(\d+)<\/td>/g)].map((m) => m[1]);
        if (matches.length >= 5) {
          const latestStats = {
            citations: matches[0],
            hIndex: matches[2],
            i10Index: matches[4],
          };
          setScholarStats(latestStats);
          localStorage.setItem('scholar-stats-cache', JSON.stringify(latestStats));
        }
      } catch {
        // 访客网络受限时保持兜底数据
      }
    };

    fetchScholarStats();
  }, [social.google_scholar]);

  // Check local storage for user's like status
  useEffect(() => {
    if (!features.enable_likes) return;

    const userHasLiked = localStorage.getItem('jiale-website-user-liked');
    if (userHasLiked === 'true') {
      setHasLiked(true);
    }
  }, [features.enable_likes]);

  const handleLike = () => {
    const newLikedState = !hasLiked;
    setHasLiked(newLikedState);

    if (newLikedState) {
      localStorage.setItem('jiale-website-user-liked', 'true');
      setShowThanks(true);
      setTimeout(() => setShowThanks(false), 2000);
    } else {
      localStorage.removeItem('jiale-website-user-liked');
      setShowThanks(false);
    }
  };

  const socialLinks: Array<{
    name: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    isEmail?: boolean;
    isLocation?: boolean;
    isScholar?: boolean;
  }> = [
    ...(social.email ? [{
      name: messages.profile.email,
      href: `mailto:${social.email}`,
      icon: EnvelopeIcon,
      isEmail: true,
    }] : []),
    ...(social.location || social.location_details ? [{
      name: messages.profile.location,
      href: social.location_url || '#',
      icon: MapPinIcon,
      isLocation: true,
    }] : []),
    ...(social.google_scholar ? [{
      name: '谷歌学术',
      href: social.google_scholar,
      icon: AcademicCapIcon,
      isScholar: true,
    }] : []),
    ...(social.orcid ? [{
      name: 'ORCID',
      href: social.orcid,
      icon: OrcidIcon,
    }] : []),
    ...(social.github ? [{
      name: 'GitHub',
      href: social.github,
      icon: Github,
    }] : []),
    ...(social.linkedin ? [{
      name: 'LinkedIn',
      href: social.linkedin,
      icon: Linkedin,
    }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-8"
    >
      {/* Profile Image Carousel */}
      <div
        className="w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* 横向滑动轨道 */}
        <div
          className="flex w-full h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {avatarList.map((src, index) => (
            <div key={src} className="w-full h-full flex-shrink-0 relative">
              <Image
                src={src}
                alt={`${author.name} - ${index + 1}`}
                width={256}
                height={256}
                className={`w-full h-full object-cover ${
                  src === '/bio22.jpg' ? 'object-[32%_center]' : 'object-center'
                }`}
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* 底部小圆点指示器 (多于 1 张照片时显示) */}
        {avatarList.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
            {avatarList.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`切换到第 ${index + 1} 张照片`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? 'w-4 bg-white'
                    : 'w-1.5 bg-white/60 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Name and Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">
          {author.name}
        </h1>
        <p className="text-lg text-accent font-medium mb-1">
          {author.title}
        </p>
        <p className="text-neutral-600 mb-2">
          {author.institution}
        </p>
      </div>

      {/* Contact Links */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 relative px-2">
        {socialLinks.map((link) => {
          const IconComponent = link.icon;
          if (link.isLocation) {
            return (
              <div key={link.name} className="relative">
                <button
                  onMouseEnter={() => {
                    if (!isAddressPinned) setShowAddress(true);
                    setLastClickedTooltip('address');
                  }}
                  onMouseLeave={() => !isAddressPinned && setShowAddress(false)}
                  onClick={() => {
                    setIsAddressPinned(!isAddressPinned);
                    setShowAddress(!isAddressPinned);
                    setLastClickedTooltip('address');
                  }}
                  className={`p-2 sm:p-2 transition-colors duration-200 ${
                    isAddressPinned
                      ? 'text-accent'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-accent'
                  }`}
                  aria-label={link.name}
                >
                  {isAddressPinned ? (
                    <MapPinSolidIcon className="h-5 w-5" />
                  ) : (
                    <MapPinIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Address tooltip */}
                <AnimatePresence>
                  {(showAddress || isAddressPinned) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -10, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg shadow-lg border border-neutral-700 pointer-events-auto min-w-[200px] max-w-[280px] sm:max-w-xs ${
                        lastClickedTooltip === 'address' ? 'z-[10000]' : 'z-[9999]'
                      }`}
                      onMouseEnter={() => {
                        if (!isAddressPinned) setShowAddress(true);
                        setLastClickedTooltip('address');
                      }}
                      onMouseLeave={() => !isAddressPinned && setShowAddress(false)}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          <p className="font-semibold">{messages.profile.workAddress}</p>
                          {!isAddressPinned && (
                            <div className="flex items-center space-x-0.5 text-xs text-neutral-400">
                              <Pin className="h-2.5 w-2.5" />
                              <span className="hidden sm:inline">{messages.profile.clickToPin}</span>
                            </div>
                          )}
                        </div>
                        {social.location_details?.map((line, i) => (
                          <p key={i} className="break-words">{line}</p>
                        ))}
                        <div className="mt-2 flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 justify-center">
                          {social.location_url && (
                            <a
                              href={social.location_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center space-x-1 px-3 py-1 bg-accent text-white rounded hover:bg-accent/90 transition-colors text-xs font-medium w-full"
                            >
                              <MapPinIcon className="h-4 w-4" />
                              <span>{messages.profile.googleMap}</span>
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          if (link.isEmail) {
            return (
              <div key={link.name} className="relative">
                <button
                  onMouseEnter={() => {
                    if (!isEmailPinned) setShowEmail(true);
                    setLastClickedTooltip('email');
                  }}
                  onMouseLeave={() => !isEmailPinned && setShowEmail(false)}
                  onClick={() => {
                    setIsEmailPinned(!isEmailPinned);
                    setShowEmail(!isEmailPinned);
                    setLastClickedTooltip('email');
                  }}
                  className={`p-2 sm:p-2 transition-colors duration-200 ${
                    isEmailPinned
                      ? 'text-accent'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-accent'
                  }`}
                  aria-label={link.name}
                >
                  {isEmailPinned ? (
                    <EnvelopeSolidIcon className="h-5 w-5" />
                  ) : (
                    <EnvelopeIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Email tooltip */}
                <AnimatePresence>
                  {(showEmail || isEmailPinned) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -10, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg shadow-lg border border-neutral-700 pointer-events-auto min-w-[200px] max-w-[280px] sm:max-w-xs ${
                        lastClickedTooltip === 'email' ? 'z-[10000]' : 'z-[9999]'
                      }`}
                      onMouseEnter={() => {
                        if (!isEmailPinned) setShowEmail(true);
                        setLastClickedTooltip('email');
                      }}
                      onMouseLeave={() => !isEmailPinned && setShowEmail(false)}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          <p className="font-semibold">{messages.profile.email}</p>
                          {!isEmailPinned && (
                            <div className="flex items-center space-x-0.5 text-xs text-neutral-400">
                              <Pin className="h-2.5 w-2.5" />
                              <span className="hidden sm:inline">{messages.profile.clickToPin}</span>
                            </div>
                          )}
                        </div>
                        <p className="break-words">{social.email?.replace('@', ' (at) ')}</p>
                        <div className="mt-2">
                          <a
                            href={link.href}
                            className="inline-flex items-center justify-center space-x-1 px-3 py-1 bg-accent text-white rounded hover:bg-accent/90 transition-colors text-xs font-medium w-full"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                            <span className="sm:hidden">{messages.profile.send}</span>
                            <span className="hidden sm:inline">{messages.profile.sendEmail}</span>
                          </a>
                        </div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          if (link.isScholar) {
            return (
              <div key={link.name} className="relative">
                <button
                  onMouseEnter={() => {
                    if (!isScholarPinned) setShowScholar(true);
                    setLastClickedTooltip('scholar');
                  }}
                  onMouseLeave={() => !isScholarPinned && setShowScholar(false)}
                  onClick={() => {
                    setIsScholarPinned(!isScholarPinned);
                    setShowScholar(!isScholarPinned);
                    setLastClickedTooltip('scholar');
                  }}
                  className={`p-2 sm:p-2 transition-colors duration-200 ${
                    isScholarPinned
                      ? 'text-accent'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-accent'
                  }`}
                  aria-label={link.name}
                >
                  {isScholarPinned ? (
                    <AcademicCapSolidIcon className="h-5 w-5" />
                  ) : (
                    <AcademicCapIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Google Scholar tooltip */}
                <AnimatePresence>
                  {(showScholar || isScholarPinned) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -10, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg shadow-lg border border-neutral-700 pointer-events-auto min-w-[200px] max-w-[280px] sm:max-w-xs ${
                        lastClickedTooltip === 'scholar' ? 'z-[10000]' : 'z-[9999]'
                      }`}
                      onMouseEnter={() => {
                        if (!isScholarPinned) setShowScholar(true);
                        setLastClickedTooltip('scholar');
                      }}
                      onMouseLeave={() => !isScholarPinned && setShowScholar(false)}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          <p className="font-semibold">谷歌学术</p>
                          {!isScholarPinned && (
                            <div className="flex items-center space-x-0.5 text-xs text-neutral-400">
                              <Pin className="h-2.5 w-2.5" />
                              <span className="hidden sm:inline">{messages.profile.clickToPin}</span>
                            </div>
                          )}
                        </div>
                        <p className="break-words">引用次数：{scholarStats.citations}</p>
                        <p className="break-words">h 指数：{scholarStats.hIndex}</p>
                        <p className="break-words">i10 指数：{scholarStats.i10Index}</p>
                        <div className="mt-2">
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center space-x-1 px-3 py-1 bg-accent text-white rounded hover:bg-accent/90 transition-colors text-xs font-medium w-full"
                          >
                            <AcademicCapIcon className="h-4 w-4" />
                            <span>访问谷歌学术</span>
                          </a>
                        </div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2 text-neutral-600 dark:text-neutral-400 hover:text-accent transition-colors duration-200"
              aria-label={link.name}
            >
              <IconComponent className="h-5 w-5" />
            </a>
          );
        })}
      </div>

      {/* Research Interests */}
      {researchInterests && researchInterests.length > 0 && (
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="font-semibold text-primary mb-3">{messages.profile.researchInterests}</h3>
          <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-500">
            {researchInterests.map((interest, index) => (
              <div key={index}>{interest}</div>
            ))}
          </div>
        </div>
      )}

      {/* Like Button */}
      {features.enable_likes && (
        <div className="flex justify-center">
          <div className="relative">
            <motion.button
              onClick={handleLike}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                hasLiked
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 cursor-pointer'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {hasLiked ? (
                <HeartSolidIcon className="h-4 w-4" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
              <span>{hasLiked ? messages.profile.liked : messages.profile.like}</span>
            </motion.button>

            {/* Thanks bubble */}
            <AnimatePresence>
              {showThanks && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -10, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-lg text-xs whitespace-nowrap z-50 flex items-center space-x-1"
                >
                  {messages.profile.thanks} 😊
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
