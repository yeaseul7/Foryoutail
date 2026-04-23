'use client';
import { useAuth } from '@/lib/firebase/auth';
import { MappedHistoryData } from '@/packages/type/history';
import { useClickOutside } from '@/packages/utils/clickEvent';
import { getAndMappingHistoryToCommentData } from '@/packages/utils/history/history';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import UserProfile from '../../common/UserProfile';
import { markHistoryAsRead } from '@/lib/domain/community/history';

interface NotificationPopProps {
  onClose?: () => void;
}

export default function NotificationPop({ onClose }: NotificationPopProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<MappedHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useClickOutside<HTMLDivElement>(popupRef, () => onClose?.(), !!onClose);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const fetchedNotifications = await getAndMappingHistoryToCommentData(
          user.uid,
        );
        console.log(fetchedNotifications);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('알림 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleNotificationClick = async (postId: string, historyId: string) => {
    router.push(`/read/${postId}`);
    if (user?.uid) {
      await markHistoryAsRead(user.uid, historyId);
    }
    onClose?.();
  };

  const truncateTitle = (title: string, maxLength: number = 10): string => {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="fixed md:absolute right-4 md:right-0 top-[60px] md:top-full mt-0 md:mt-2 z-51 left-4 md:left-auto">
      <div
        className="relative w-full max-h-[80vh] overflow-y-auto bg-element1 rounded-lg shadow-[0px_0px_8px_rgba(0,0,0,0.1)] md:w-96"
        ref={popupRef}
      >
        <div className="flex flex-col p-1 sm:p-2">
          {loading ? (
            <div className="p-3 text-xs text-center text-text2 sm:text-sm">
              로딩 중...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-3 text-xs text-center text-text2 sm:text-sm">
              알림이 없습니다
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.historyId}
                className={`flex gap-2 items-start p-2 text-left rounded-md transition-colors ${
                  notification.isRead
                    ? 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                    : 'text-text1 hover:bg-element2'
                }`}
                onClick={() =>
                  handleNotificationClick(
                    notification.postId,
                    notification.historyId,
                  )
                }
              >
                <div className="shrink-0 mt-0.5">
                  <UserProfile
                    profileUrl={notification.authorPhotoURL}
                    profileName={notification.authorName}
                    imgSize={16}
                    sizeClass="w-5 h-5 sm:w-6 sm:h-6"
                    existName={false}
                    iconSize="text-xs"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed break-words sm:text-sm">
                    <span className="font-semibold">
                      {notification.authorName}
                    </span>
                    님이{' '}
                    <span className="font-semibold">
                      {truncateTitle(notification.title)}
                    </span>
                    에{' '}
                    <span className="font-semibold">
                      {notification.actionType}
                    </span>
                    남겼습니다.
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
