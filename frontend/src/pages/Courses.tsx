import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnail?: string;
}

const Courses: React.FC = () = {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() =u003e {
    const fetchCourses = async () =u003e {
      try {
        const response = await axios.get('/api/courses');
        setCourses(response.data.courses);
      } catch (error) {
        console.error('Failed to fetch courses', error);
      }
    };

    fetchCourses();
  }, []);

  return (
    div className="p-8"
      h1 className="text-2xl font-bold"Courses/h1
      div className="mt-4 space-y-4"
        {courses.map(course =u003e (
          Link key={course._id} to={`/courses/${course._id}`} className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition"
            motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              div className="flex items-center space-x-4"
                {course.thumbnail ? 
                  img src={course.thumbnail} alt={course.title} className="w-16 h-16 object-cover rounded" / :
                  div className="w-16 h-16 bg-gray-200 rounded"/div
                }
                div
                  h3 className="text-lg font-medium"{course.title}/h3
                  p className="text-sm text-gray-500"{course.category} - {course.level}/p
                  p className="text-gray-700"{course.description.substring(0, 100)}.../p
                /div
              /div
            /motion.div
          /Link
        ))}
      /div
    /div
  );
};

export default Courses;
