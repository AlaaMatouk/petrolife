import { useState } from "react";
import { Fuel, Users } from "lucide-react";
import { TimeFilter } from "./TimeFilter";
import { Table } from "./Table";

interface StationData {
  name: string;
  email: string;
  price: number;
  image?: string;
}

interface DriverData {
  name: string;
  email: string;
  price: number;
  image?: string;
}
interface CompanyData {
  name: string;
  email: string;
  price: number;
  image?: string;
}

interface MostUsedSectionProps {
  stationsData: StationData[];
  driversData: DriverData[];
  companiesData: CompanyData[];
  stationsTitle?: string;
  driversTitle?: string;
  companiesTitle?: string;
}

const MostUsedSection = ({
  stationsData,
  driversData,
  companiesData,
  stationsTitle = "محطات الوقود الأكثر استخداما",
  driversTitle = "العملاء الأكثر استهلاكا",
  companiesTitle = "الشركات الأكثر استهلاكا",
}: MostUsedSectionProps) => {
  const [selectedStationsFilter, setSelectedStationsFilter] =
    useState("اخر 6 شهور");
  const [selectedDriversFilter, setSelectedDriversFilter] =
    useState("اخر 6 شهور");
  const [selectedCompaniesFilter, setSelectedCompaniesFilter] =
    useState("اخر 6 شهور");

  // Table columns for stations
  const stationsColumns = [
    {
      key: "price",
      width: "",
      render: (_value: any, station: any) => (
        <div className="text-right">
          <div className="font-bold text-[16px] text-[#6C32A9]">
            {station?.price ? `${station.price} ر.س` : "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "station",
      width: "w-full",
      render: (_value: any, station: any) => (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[#5B738B] text-[16px] font-bold [direction:rtl] text-right">
              {station?.name || "N/A"}
            </div>
            <div className="text-sm text-[#5B738B] font-normal [direction:rtl] text-right">
              {station?.email || "N/A"}
            </div>
          </div>
          {station?.image ? (
            <img
              src={station.image}
              alt={station.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Fuel className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
      ),
    },
  ];

  // Table columns for drivers
  const driversColumns = [
    {
      key: "price",
      width: "",
      render: (_value: any, driver: any) => (
        <div className="text-right">
          <div className="font-bold text-[16px] text-[#6C32A9]">
            {driver?.price ? `${driver.price} ر.س` : "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "driver",
      width: "w-full",
      render: (_value: any, driver: any) => (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[#5B738B] text-[16px] font-bold [direction:rtl] text-right">
              {driver?.name || "N/A"}
            </div>
            <div className="text-sm text-[#5B738B] font-normal [direction:rtl] text-right">
              {driver?.email || "N/A"}
            </div>
          </div>
          {driver?.image ? (
            <img
              src={driver.image}
              alt={driver.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
      ),
    },
  ];

  // Table columns for companies
  const companiesColumns = [
    {
      key: "price",
      width: "",
      render: (_value: any, company: any) => (
        <div className="text-right">
          <div className="font-bold text-[16px] text-[#6C32A9]">
            {company?.price ? `${company.price} ر.س` : "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "company",
      width: "w-full",
      render: (_value: any, company: any) => (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[#5B738B] text-[16px] font-bold [direction:rtl] text-right">
              {company?.name || "N/A"}
            </div>
            <div className="text-sm text-[#5B738B] font-normal [direction:rtl] text-right">
              {company?.email || "N/A"}
            </div>
          </div>
          {company?.image ? (
            <img
              src={company.image}
              alt={company.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
      {/* Most Used Stations */}
      <div className="bg-white border rounded-[16px] border-gray-200 p-6 shadow-sm">
        <div className="mb-6 ">
          <div className="flex justify-end mb-4">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <h3 className="text-[#5A66C1] font-bold text-[20px] leading-[28px] [direction:rtl] relative whitespace-nowrap ">
                {stationsTitle}
              </h3>
            </div>
          </div>
          <div className="flex justify-start items-end">
            <TimeFilter
              selectedFilter={selectedStationsFilter}
              onFilterChange={setSelectedStationsFilter}
            />
          </div>
        </div>

        <Table
          columns={stationsColumns}
          data={stationsData}
          className="mb-4 "
        />
      </div>

      {/* Most Consuming Drivers */}
      <div className="bg-white border rounded-[16px] border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex justify-end mb-4">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <h3 className="text-[#5A66C1] font-bold text-[20px] leading-[28px] [direction:rtl] relative whitespace-nowrap ">
                {driversTitle}
              </h3>
            </div>
          </div>
          <div className="flex justify-start items-end">
            <TimeFilter
              selectedFilter={selectedDriversFilter}
              onFilterChange={setSelectedDriversFilter}
            />
          </div>
        </div>

        <Table columns={driversColumns} data={driversData} className="mb-4" />
      </div>

      {/* Most Consuming Companies */}
      <div className="bg-white border rounded-[16px] border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex justify-end mb-4">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <h3 className="text-[#5A66C1] font-bold text-[20px] leading-[28px] [direction:rtl] relative whitespace-nowrap ">
                {companiesTitle}
              </h3>
            </div>
          </div>
          <div className="flex justify-start items-end">
            <TimeFilter
              selectedFilter={selectedCompaniesFilter}
              onFilterChange={setSelectedCompaniesFilter}
            />
          </div>
        </div>

        <Table
          columns={companiesColumns}
          data={companiesData}
          className="mb-4"
        />
      </div>
    </section>
  );
};

export default MostUsedSection;
