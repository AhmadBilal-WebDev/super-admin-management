const hasSidebarButton = (user, sectionKey, buttonKey) => {
    const allowed = user?.allowedSidebar || [];

    if (!allowed.length) {
        return true;
    }

    const section = allowed.find((item) => item.key === sectionKey);
    return Boolean(section?.buttons?.includes(buttonKey));
};

export default hasSidebarButton;
