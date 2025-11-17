import { MultiSelect } from "@mantine/core";

const MultiSelectComponent = ({ setFilter, filter, magazineList }) => { 
  return (
    <MultiSelect
      placeholder="Ajouter des supports"
      data={magazineList} 
      value={filter.support}
      comboboxProps={{ transitionProps: { transition: "pop", duration: 200 } }}
      onChange={(value) => setFilter("support", value)}
      searchable
      nothingFoundMessage="Aucun support trouvé"
    />
  );
};

export default MultiSelectComponent;