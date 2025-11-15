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

  const projectsWithDates = useMemo(() => {
    return projects.filter(p => p.start_date || p.due_date);
  }, [projects]);

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const grid: ({ day: number; date: Date; isCurrentMonth: boolean; projectRanges: Array<{project: Project, isStart: boolean, isEnd: boolean, isInRange: boolean}> })[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      grid.push({ day, date, isCurrentMonth: false, projectRanges: [] });
    }

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const projectRanges = projectsWithDates.map(p => {
        const startDate = new Date(p.start_date);
        const endDate = p.due_date ? new Date(p.due_date) : startDate;

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        const currentDay = new Date(year, month, i);
        currentDay.setHours(0, 0, 0, 0);

        const isInRange = currentDay >= startDate && currentDay <= endDate;
        const isStart = currentDay.getTime() === startDate.getTime();
        const isEnd = currentDay.getTime() === endDate.getTime();

        return { project: p, isStart, isEnd, isInRange };
      }).filter(pr => pr.isInRange);

      grid.push({ day: i, date, isCurrentMonth: true, projectRanges });
    }

    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      grid.push({ day: i, date, isCurrentMonth: false, projectRanges: [] });
    }

    return grid;
  }, [currentDate, projectsWithDates]);

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
      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 border-l-4 border-primary mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarDaysIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading capitalize">
                  Calendario - {monthName} {year}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Vista cronológica de proyectos y fechas importantes</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card"><ChevronLeftIcon className="w-5 h-5" /></button>
              <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
          </div>
          <Button variant="secondary" onClick={handleGoToToday}>Hoy</Button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-gray-200 dark:bg-dark-border rounded-lg overflow-hidden shadow-md">
        {daysOfWeek.map(day => (
          <div key={day} className="flex items-center justify-center p-2 text-sm font-semibold text-gray-700 bg-gray-50 dark:bg-dark-bg dark:text-gray-300">
            {day}
          </div>
        ))}

        {calendarGrid.slice(0, 42).map(({ day, date, isCurrentMonth, projectRanges }, index) => {
          const isToday = new Date().toDateString() === date.toDateString();
          return (
            <div key={index} className={`p-2 bg-white dark:bg-dark-card flex flex-col ${!isCurrentMonth ? 'opacity-50' : ''}`}>
              <div className={`flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${isToday ? 'bg-primary text-white' : ''}`}>
                {day}
              </div>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {projectRanges.map(({ project: p, isStart, isEnd }) => {
                    const priorityConfig = PRIORITY_CONFIG[p.priority];
                    const showLabel = isStart;
                    const roundedLeft = isStart ? 'rounded-l-md' : '';
                    const roundedRight = isEnd ? 'rounded-r-md' : '';

                    return (
                        <div
                            key={p.id}
                            onClick={() => handleProjectClick(p)}
                            className={`p-1 cursor-pointer hover:brightness-110 transition-all duration-200 ${priorityConfig.color} ${roundedLeft} ${roundedRight}`}
                            title={p.title}
                        >
                            {showLabel && (
                                <p className={`text-xs font-semibold truncate ${priorityConfig.textColor}`}>{p.title}</p>
                            )}
                            {!showLabel && (
                                <div className="h-4"></div>
                            )}
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