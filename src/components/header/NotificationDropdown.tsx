return (
    <div className="relative">
      {/* Notification Icon Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative h-10 w-10 border rounded-full flex items-center justify-center dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop: Peeche ka area blur/dark karne ke liye (Sirf mobile pe) */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[998] md:hidden" 
            onClick={() => setIsOpen(false)} 
          />

          {/* Notification Center Logic */}
          <div className="
            /* Mobile Styles: Screen ke center mein fit aayega */
            fixed inset-x-4 top-[15%] bottom-auto 
            /* Desktop Styles: Icon ke niche side pe aayega */
            md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96 
            bg-white dark:bg-[#1a1c23] shadow-2xl rounded-3xl border dark:border-gray-800 
            z-[999] overflow-hidden flex flex-col transition-all transform animate-in fade-in zoom-in duration-200"
          >
            {/* Header */}
            <div className="p-5 border-b dark:border-gray-800 font-bold flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
              <div className="flex items-center gap-2">
                <span className="text-base">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="max-h-[60vh] md:max-h-[450px] overflow-y-auto overscroll-contain">
              {isLoading ? (
                 <div className="p-10 text-center flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-400">Checking for updates...</p>
                 </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-2">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Inbox is empty</p>
                  <p className="text-[11px] text-gray-400">No new alerts at the moment.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={async () => {
                      setIsOpen(false);
                      if (!n.read) await updateDoc(doc(db, "notification", n.id), { read: true });
                      handleNavigation(n);
                    }}
                    className={`p-4 border-b dark:border-gray-800/60 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/40 flex flex-col gap-1 relative ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'opacity-70'}`}
                  >
                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                      <p className="text-[10px] text-gray-400">
                        {n.sentAt ? new Date(n.sentAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Footer: Mark all as read etc. */}
            <div className="p-3 bg-gray-50/50 dark:bg-gray-800/20 text-center border-t dark:border-gray-800">
               <button className="text-[11px] text-blue-500 font-semibold hover:underline">View All Notifications</button>
            </div>
          </div>
        </>
      )}
    </div>
  );