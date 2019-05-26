import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Suspense,
} from 'react';
import axios from 'axios';
import { Grid, Loader, Container } from 'semantic-ui-react';

import Filters from './Filters';
import SortBar from './SortBar';
import HotelsList from './HotelsList';
import ChartSwitcher from './ChartSwitcher';
// import RatingChart from './RatingChart';
import lazyWithPreload from '../../utils/lazyWithPreload';
import { ONLINE_URL, BEDS_TYPE } from '../../utils/const';
// const RatingChart = React.lazy(() => import('./RatingChart'));

//react lazy zawsze stosujemy z react suspense bo inaczej beda bledy
const RatingChart = lazyWithPreload(() => import('./RatingChart'));
//wykozystanie lazy preload jako odzielnej funkcji ktora jest reuzywalna
//oznacza to ładowanie komponentu jesli on bedzie renderwany, 1 ładowanie wszytskiego innego, a jesli zrobimy jakas akcje np klik to dopiero to bedzie
// renderowane, a dopoki nie klikniey to nie renderuje sie to
const SelectHotel = props => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bedTypeFilter, setBedTypeFilter] = useState({});
  const [sortHotel, setSortHotel] = useState('price');
  const [isChartVisible, setisChartVisible] = useState(false);

  // useEffect(() => {
  //   fetch(ONLINE_URL)
  //     .then(response => response.json())
  //     .then(data => {
  //       console.log(data);
  //       setHotels(data.list); // set users in state
  //     });
  // }, []);

  useEffect(() => {
    const LoadingHotel = () => {
      fetch(ONLINE_URL)
        .then(response => response.json())
        .then(data => {
          console.log(data);
          setHotels(data.list); // set hotels in state
          setLoading(false);
        });
    };
    LoadingHotel();
  }, []);
  //tworzymy obiekt ktora zwraca rodzaj lozka jako klucz i wartosc true lub false
  //funkcja pomocnicza
  const FilterBed = useCallback(
    (key, value) => {
      console.log(key);
      console.log(value);
      setBedTypeFilter({
        ...bedTypeFilter,
        [key]: value,
      });
    },
    [bedTypeFilter]
  );
  console.log(bedTypeFilter);
  //szukanie hoteli po lozku
  // const filteredHotels = applyFilter(bedTypeFilter, hotels);
  //szukanie hoteli z memo
  const filteredHotels = useMemo(() => applyFilter(bedTypeFilter, hotels), [
    bedTypeFilter,
    hotels,
    //informacja do usememo kiedy ma sie zmienic i co sie zmienic jesli sie przeladuje
    //memo wykonaj cos jako 1 parametr, jako drui dane ktoe maja byc zmienione jesli sie zmienia
  ]);
  //sortowanie hoteli
  // const sortedHotels = applySort(filteredHotels, sortHotel);
  //sot z memo
  const sortedHotels = useMemo(() => applySort(filteredHotels, sortHotel), [
    filteredHotels,
    sortHotel,
  ]);
  // const chartData = prepareChartData(sortedHotels);
  const chartData = useMemo(() => prepareChartData(sortedHotels), [
    sortedHotels,
  ]);
  //ilosc hoteli w nawiasach
  // const SumBed = countHotelsByBedType(hotels);
  //ilosc hoteli z memo
  const SumBed = useMemo(() => countHotelsByBedType(hotels), [hotels]);

  return (
    <Container>
      <SortBar sortField={sortedHotels} setField={setSortHotel} />
      <Layout>
        <Layout.Sidebar>
          <ChartSwitcher
            isChartVisible={isChartVisible}
            switchChartVisible={setisChartVisible}
          />
          <Filters count={SumBed} onChange={FilterBed} />
        </Layout.Sidebar>
        <Layout.Feed isLoading={loading}>
          {isChartVisible && (
            <Suspense fallback={<Loader active inline="centered" />}>
              <RatingChart data={chartData} />
            </Suspense>
          )}
          {loading ? (
            <Loader active inline="centered" />
          ) : (
            <HotelsList hotels={filteredHotels} selectHotel={noop} />
          )}
        </Layout.Feed>
      </Layout>
    </Container>
  );
};

const noop = () => {};

function countHotelsByBedType(data) {
  return data.reduce(function(acc, v) {
    acc[v.room] = acc[v.room] ? acc[v.room] + 1 : 1;
    return acc;
  }, {});
}

function applyFilter(filters, data) {
  console.log('applyFilter');
  const isFilterSet = BEDS_TYPE.find(b => filters[b.value]);
  if (!isFilterSet) {
    return data;
  }
  const filtered = data.filter(h => filters[h.room]);
  return filtered;
}

function prepareChartData(hotels) {
  return hotels.map(h => ({
    rating: +h.rating.average,
    price: h.price.amount,
    reviews: h.rating.reviews,
    name: h.title,
  }));
}
const sortHotels = {
  price: (a, b) => a.price.amount - b.price.amount,
  rating: (a, b) => b.rating.average - a.rating.average,
  reviews: (a, b) => b.rating.reviews - a.rating.reviews,
};

function applySort(hotels, sortField) {
  console.log('applay');
  return hotels.sort(sortHotels[sortField]).concat([]);
}

const Layout = ({ children }) => (
  <Grid stackable divided>
    <Grid.Row>{children}</Grid.Row>
  </Grid>
);
const Sidebar = ({ children }) => (
  <Grid.Column width={4}>{children}</Grid.Column>
);

const Feed = ({ children }) => <Grid.Column width={12}>{children}</Grid.Column>;

Layout.Sidebar = Sidebar;
Layout.Feed = Feed;

export default SelectHotel;
