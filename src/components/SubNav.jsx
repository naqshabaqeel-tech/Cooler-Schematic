import Button from './Button';

export default function SubNav({ showArchived, onToggleArchived, onNewSchematic }) {
  return (
    <div className="flex items-center justify-between h-14 px-6 border-b border-[#F1F5F9] bg-white">
      {/* Search */}
      <div className="flex items-center gap-1 h-8 px-2 rounded-lg border border-[#EAECF0] bg-white w-[249px]">
        <img src="/assets/MagnifyingGlass.svg" alt="" className="w-4 h-4 shrink-0" />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent border-none outline-none text-sm font-medium text-gray-500 placeholder:text-gray-500 w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!showArchived && (
          <Button
            type="Outline"
            size="sm"
            onClick={onToggleArchived}
            leadingIcon={<img src="/assets/Archive 2.svg" alt="" className="w-3.5 h-3.5" />}
          >
            Archived
          </Button>
        )}
        <Button
          type="Default"
          size="sm"
          onClick={onNewSchematic}
          leadingIcon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12.25 7C12.25 7.13261 12.1973 7.25979 12.1036 7.35355C12.0098 7.44732 11.8826 7.5 11.75 7.5H7.5V11.75C7.5 11.8826 7.44732 12.0098 7.35355 12.1036C7.25979 12.1973 7.13261 12.25 7 12.25C6.86739 12.25 6.74021 12.1973 6.64645 12.1036C6.55268 12.0098 6.5 11.8826 6.5 11.75V7.5H2.25C2.11739 7.5 1.99021 7.44732 1.89645 7.35355C1.80268 7.25979 1.75 7.13261 1.75 7C1.75 6.86739 1.80268 6.74021 1.89645 6.64645C1.99021 6.55268 2.11739 6.5 2.25 6.5H6.5V2.25C6.5 2.11739 6.55268 1.99021 6.64645 1.89645C6.74021 1.80268 6.86739 1.75 7 1.75C7.13261 1.75 7.25979 1.80268 7.35355 1.89645C7.44732 1.99021 7.5 2.11739 7.5 2.25V6.5H11.75C11.8826 6.5 12.0098 6.55268 12.1036 6.64645C12.1973 6.74021 12.25 6.86739 12.25 7Z" fill="white"/>
            </svg>
          }
        >
          New Schematic
        </Button>
      </div>
    </div>
  );
}
