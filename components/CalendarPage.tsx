import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { PRIORITY_CONFIG } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import ProjectModal from './ProjectModal';
import Button from './ui/Button';
import { useData } from '../hooks/useData';

const CalendarPage: React.FC = () => {
  const { projects } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const projectsWithDueDates = useMemo(() => {
    return projects.filter(p => p.due_date);
  }, [projects]);

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0=Monday, 6=Sunday
    const totalDays = lastDayOfMonth.getDate();

    const grid: ({ day: number; date: Date; isCurrentMonth: boolean; projects: Project[] })[] = [];
    
    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      grid.push({ day, date, isCurrentMonth: false, projects: [] });
    }

    // Days from current month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const dayProjects = projectsWithDueDates.filter(p => {
        const dueDate = new Date(p.due_date!);
        return dueDate.getFullYear() === year && dueDate.getMonth() === month && dueDate.getDate() === i;
      });
      grid.push({ day: i, date, isCurrentMonth: true, projects: dayProjects });
    }

    // Days from next month
    const remainingCells = 42 - grid.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      grid.push({ day: i, date, isCurrentMonth: false, projects: [] });
    }
    
    return grid;
  }, [currentDate, projectsWithDueDates]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleGoToToday = () => {
      setCurrentDate(new Date());
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  }

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading capitalize">
            {monthName} {year}
          </h1>
          <div className="flex items-center space-x-1">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card"><ChevronLeftIcon className="w-5 h-5" /></button>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card"><ChevronRightIcon className="w-5 h-5" /></button>
          </div>
        </div>
        <Button variant="secondary" onClick={handleGoToToday}>Hoy</Button>
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-gray-200 dark:bg-dark-border rounded-lg overflow-hidden shadow-md">
        {daysOfWeek.map(day => (
          <div key={day} className="flex items-center justify-center p-2 text-sm font-semibold text-gray-700 bg-gray-50 dark:bg-dark-bg dark:text-gray-300">
            {day}
          </div>
        ))}

        {calendarGrid.slice(0, 42).map(({ day, date, isCurrentMonth, projects }, index) => {
          const isToday = new Date().toDateString() === date.toDateString();
          return (
            <div key={index} className={`p-2 bg-white dark:bg-dark-card flex flex-col ${!isCurrentMonth ? 'opacity-50' : ''}`}>
              <div className={`flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${isToday ? 'bg-primary text-white' : ''}`}>
                {day}
              </div>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {projects.map(p => {
                    const priorityConfig = PRIORITY_CONFIG[p.priority];
                    return (
                        <div 
                            key={p.id}
                            onClick={() => handleProjectClick(p)}
                            className={`p-1.5 rounded-md cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 ${priorityConfig.color}`}
                        >
                            <p className={`text-xs font-semibold truncate ${priorityConfig.textColor}`}>{p.title}</p>
                        </div>
                    )
                })}
              </div>
            </div>
          );
        })}
      </div>
       {isModalOpen && <ProjectModal project={selectedProject} onClose={closeModal} />}
    </div>
  );
};

export default CalendarPage;