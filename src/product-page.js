
document.addEventListener('DOMContentLoaded', () => {
    const sectionTabs = document.getElementById('section-tabs');
    const tabs = sectionTabs.querySelectorAll('a');
    const sections = Array.from(document.querySelectorAll('[id^="section-"]')).filter(section => section.id !== 'section-tabs');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const activeTab = document.querySelector(`a[href="#${id}"]`);

                // Remove active styles from all tabs
                tabs.forEach(tab => {
                    tab.classList.remove('border-b-[#ea2832]', 'text-black');
                    tab.classList.add('border-b-transparent', 'text-[#994d51]');
                });

                // Add active styles to the current tab
                activeTab.classList.add('border-b-[#ea2832]', 'text-black');
                activeTab.classList.remove('border-b-transparent', 'text-[#994d51]');

                // Scroll the active tab into view
                activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });
    }, {
        rootMargin: '-115px 0px -75% 0px', 
        threshold: 0
    });

    sections.forEach(section => {
        observer.observe(section);
    });
});
