'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function WorkoutPage() {
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const exercisesParam = searchParams.get('exercises');
    if (exercisesParam) {
      const parsedExercises = JSON.parse(exercisesParam);
      setExercises(parsedExercises);
    }
  }, [searchParams]);

  // Toplam süreyi ve her bir egzersizin süresini belirler
  useEffect(() => {
    if (exercises.length > 0) {
      let totalDuration = exercises.reduce((acc, exercise) => {
        const [minutes, seconds] = exercise.duration.split(':').map(Number);
        return acc + minutes * 60 + seconds;
      }, 0);
      setTotalTime(totalDuration);
      setExerciseTime(getDurationInSeconds(exercises[0].duration));
      setIsStarted(true);
    }
  }, [exercises]);

  // Egzersiz zamanlayıcısı
  useEffect(() => {
    let timer;
    if (!isPaused && isStarted) {
      if (exerciseTime > 0) {
        timer = setInterval(() => {
          setExerciseTime((prev) => prev - 1);
          setTotalTime((prev) => prev - 1);
        }, 1000);
      } else if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setExerciseTime(
          getDurationInSeconds(exercises[currentExerciseIndex + 1].duration)
        );
        playBeep();
      } else {
        playBeep();
        setTimeout(() => {
          router.push('/exercises');
        }, 500);
      }
    }
    return () => clearInterval(timer);
  }, [
    isPaused,
    isStarted,
    exerciseTime,
    currentExerciseIndex,
    exercises,
    router,
  ]);

  // Egzersizin süresini saniyeye çevirir
  const getDurationInSeconds = (duration) => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Beep sesi oynatma
  const playBeep = () => {
    const beep = new Audio('/assets/ding.wav');
    beep.play();
  };

  // Egzersizi duraklat ve devam ettir
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  // Video URL'sini iframe embed yapısına çevir
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const embedUrl = url.replace('watch?v=', 'embed/');
    return `${embedUrl}&autoplay=1`;
  };

  // Bir sonraki egzersize geçiş ve toplam süreden düşme
  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      const currentExerciseDurationInSeconds = getDurationInSeconds(
        exercises[currentExerciseIndex].duration
      );
      setTotalTime(
        (prevTotalTime) => prevTotalTime - currentExerciseDurationInSeconds
      );

      setCurrentExerciseIndex((prev) => prev + 1);
      setExerciseTime(
        getDurationInSeconds(exercises[currentExerciseIndex + 1].duration)
      );
      playBeep();
    } else {
      router.push('/exercises');
    }
  };

  // Bir önceki egzersize dönüş ve toplam süreye ekleme
  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      const previousExerciseDurationInSeconds = getDurationInSeconds(
        exercises[currentExerciseIndex - 1].duration
      );
      setTotalTime(
        (prevTotalTime) => prevTotalTime + previousExerciseDurationInSeconds
      );

      setCurrentExerciseIndex((prev) => prev - 1);
      setExerciseTime(
        getDurationInSeconds(exercises[currentExerciseIndex - 1].duration)
      );
    }
  };

  const getExerciseTitle = () => {
    return exercises[currentExerciseIndex]?.title || '';
  };

  return (
    <div className="container mx-auto mt-10 px-2 sm:px-0 sm:flex items-center justify-between sm:space-x-10">
      {exercises.length > 0 ? (
        <>
          <div
            className={`${exercises[currentExerciseIndex].videoUrl ? 'sm:w-4/12' : 'sm:w-10/12'} space-y-4 sm:space-y-10`}
          >
            <h1 className="text-6xl text-center sm:text-left font-bold text-gray-700 my-4">
              {getExerciseTitle()}
            </h1>
            <p className="text-gray-600 mb-4 text-center sm:text-left text-sm">
              {exercises[currentExerciseIndex].description}
            </p>
            <div className="text-sm space-y-4 sm:space-y-10 text-center sm:text-left">
              <div className="space-x-2">
                <button
                  onClick={handlePrevious}
                  className="bg-transparent border border-gray-300 hover:border-gray-600 text-gray-600 font-bold px-4 rounded py-2"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="bg-transparent border border-gray-300 hover:border-gray-600 text-gray-600 font-bold px-4 rounded py-2"
                >
                  Next
                </button>
                <button
                  onClick={handlePauseResume}
                  className="border border-gray-300 hover:border-gray-600 font-bold px-4 rounded py-2 bg-green-600 text-white"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
              <div className="text-center sm:text-left space-y-2 text-base">
                <p>
                  Time Remaining:{' '}
                  <strong>
                    {new Date(exerciseTime * 1000).toISOString().substr(14, 5)}
                  </strong>
                </p>
                <p>
                  Total Time Left:{' '}
                  <strong>
                    {new Date(totalTime * 1000).toISOString().substr(14, 5)}
                  </strong>
                </p>
              </div>
            </div>
          </div>
          {exercises[currentExerciseIndex].videoUrl && (
            <div className="mt-4 bg-gray-400 sm:mt-0 w-full sm:w-6/12">
              <iframe
                className="rounded-2xl mx-auto w-full h-60 sm:h-96"
                src={getEmbedUrl(exercises[currentExerciseIndex].videoUrl)}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
          )}
          <div className="mt-4 sm:mt-0 text-center sm:text-left sm:w-2/12">
            <div>
              {exercises.map((exercise, index) => (
                <span
                  key={index}
                  className={
                    currentExerciseIndex === index
                      ? 'font-bold mb-2 inline-block w-full bg-gray-100 px-2 py-1 -ml-2 rounded'
                      : ' inline-block w-full mb-2 text-sm'
                  }
                >
                  {exercise.title}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div>
          <h2>No exercises selected</h2>
          <button
            onClick={() => router.push('/exercises')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}
