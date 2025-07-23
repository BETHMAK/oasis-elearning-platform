import React from 'react';
import { useParams } from 'react-router-dom';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Course Detail</h1>
      <p>Course ID: {id}</p>
    </div>
  );
};

export default CourseDetail;
