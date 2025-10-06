import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const StaffOverviewCard = ({ employeeList, schedule }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Overview</CardTitle>
        <CardDescription>
          Current team members and their positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {employeeList.map((employee) => (
            <div
              key={employee.id}
              className="bg-card border rounded-lg p-4 flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 text-lg font-semibold">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {employee.position}
                  </p>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span>${employee.hourlyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="truncate max-w-[150px]">
                    {employee.contact}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekly Hours:</span>
                  <span>
                    {schedule
                      .filter((entry) => entry.employeeId === employee.id)
                      .reduce((total, entry) => {
                        const start = new Date(
                          `1970-01-01T${entry.startTime}`
                        );
                        const end = new Date(`1970-01-01T${entry.endTime}`);
                        const diffHours =
                          (end.getTime() - start.getTime()) /
                          (1000 * 60 * 60);
                        return total + diffHours;
                      }, 0)
                      .toFixed(1)}
                    h
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffOverviewCard;

